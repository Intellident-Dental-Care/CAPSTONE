import { supabaseAdmin } from "../../shared/supabaseClient.js";

const ARCHIVE_AFTER_YEARS = 4;

const getCutoffDate = () => {
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - ARCHIVE_AFTER_YEARS);
  return cutoff;
};

// Patients become eligible once their most recent booking (any status) is
// older than the retention window. Patients who have never booked are left
// alone — there is no "last interaction" to measure them against yet.
const findEligibleUserIds = async () => {
  const { data, error } = await supabaseAdmin
    .from("bookings")
    .select("user_id, appointment_date")
    .not("user_id", "is", null);

  if (error) throw new Error(error.message);

  const lastBookingByUser = new Map();
  for (const row of data || []) {
    const current = lastBookingByUser.get(row.user_id);
    if (!current || String(row.appointment_date) > String(current)) {
      lastBookingByUser.set(row.user_id, row.appointment_date);
    }
  }

  const cutoff = getCutoffDate();
  const eligible = [];
  for (const [userId, lastBookingDate] of lastBookingByUser.entries()) {
    if (lastBookingDate && new Date(lastBookingDate) < cutoff) {
      eligible.push({ userId, lastBookingDate });
    }
  }
  return eligible;
};

const archivePatient = async (userId, lastBookingDate) => {
  const { data: user, error: userError } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (userError) throw new Error(userError.message);
  if (!user) return { userId, skipped: true, reason: "User not found" };

  const [profilesResult, bookingsResult, proceduresResult] = await Promise.all([
    supabaseAdmin.from("user_profiles").select("*").eq("user_id", userId),
    supabaseAdmin.from("bookings").select("*").eq("user_id", userId),
    supabaseAdmin.from("patient_procedures").select("*").eq("patient_id", userId),
  ]);

  if (profilesResult.error) throw new Error(profilesResult.error.message);
  if (bookingsResult.error) throw new Error(bookingsResult.error.message);
  if (proceduresResult.error) throw new Error(proceduresResult.error.message);

  const bookings = bookingsResult.data || [];
  const procedures = proceduresResult.data || [];

  const preassessmentIds = [...new Set(bookings.map((b) => b.preassessment_id).filter(Boolean))];
  let preassessments = [];
  if (preassessmentIds.length) {
    const preassessmentResult = await supabaseAdmin
      .from("patient_preassessment")
      .select("*")
      .in("id", preassessmentIds);
    if (preassessmentResult.error) throw new Error(preassessmentResult.error.message);
    preassessments = preassessmentResult.data || [];
  }

  const snapshot = {
    user,
    profiles: profilesResult.data || [],
    bookings,
    procedures,
    preassessments,
  };

  const { error: insertError } = await supabaseAdmin
    .from("archived_patients")
    .upsert({
      id: userId,
      full_name: user.full_name || null,
      email: user.email || null,
      mobile: user.mobile || null,
      last_booking_date: lastBookingDate,
      data: snapshot,
    });

  if (insertError) throw new Error(insertError.message);

  // Delete children before parents to respect foreign keys. The snapshot
  // above already preserved everything, so this is safe to do unconditionally.
  if (preassessmentIds.length) {
    await supabaseAdmin.from("patient_preassessment").delete().in("id", preassessmentIds);
  }
  await supabaseAdmin.from("patient_procedures").delete().eq("patient_id", userId);
  await supabaseAdmin.from("bookings").delete().eq("user_id", userId);
  await supabaseAdmin.from("user_profiles").delete().eq("user_id", userId);
  await supabaseAdmin.from("users").delete().eq("id", userId);

  return { userId, skipped: false };
};

const archiveDormantAccounts = async () => {
  const eligible = await findEligibleUserIds();

  let archived = 0;
  let failed = 0;
  const details = [];

  for (const { userId, lastBookingDate } of eligible) {
    try {
      const result = await archivePatient(userId, lastBookingDate);
      if (result.skipped) {
        details.push({ userId, status: "skipped", reason: result.reason });
      } else {
        archived += 1;
        details.push({ userId, status: "archived" });
      }
    } catch (error) {
      failed += 1;
      details.push({ userId, status: "failed", reason: error.message });
    }
  }

  return { archived, failed, total: eligible.length, details };
};

// Archives individual bookings once THEY turn 4 years old, independent of
// whether the owning account still has recent activity. Any procedures /
// preassessment tied to that booking move with it (regardless of the
// procedure's own date) so the booking's FK references stay clean — a
// procedure logged against a booking that's being deleted can't be left
// pointing at nothing.
const archiveOldBookings = async () => {
  const cutoffDateStr = getCutoffDate().toISOString().slice(0, 10);

  const { data: oldBookings, error } = await supabaseAdmin
    .from("bookings")
    .select("*")
    .lt("appointment_date", cutoffDateStr);

  if (error) throw new Error(error.message);

  let archived = 0;
  let failed = 0;
  const details = [];

  for (const booking of oldBookings || []) {
    try {
      const proceduresResult = await supabaseAdmin
        .from("patient_procedures")
        .select("*")
        .eq("booking_id", booking.id);

      if (proceduresResult.error) throw new Error(proceduresResult.error.message);

      let preassessment = null;
      if (booking.preassessment_id) {
        const preassessmentResult = await supabaseAdmin
          .from("patient_preassessment")
          .select("*")
          .eq("id", booking.preassessment_id)
          .maybeSingle();
        if (preassessmentResult.error) throw new Error(preassessmentResult.error.message);
        preassessment = preassessmentResult.data || null;
      }

      const snapshot = {
        booking,
        procedures: proceduresResult.data || [],
        preassessment,
      };

      const { error: insertError } = await supabaseAdmin.from("archived_bookings").upsert({
        id: booking.id,
        patient_id: booking.user_id || null,
        patient_name: booking.patient_name || null,
        service: booking.service || null,
        branch: booking.branch || null,
        appointment_date: booking.appointment_date,
        data: snapshot,
      });
      if (insertError) throw new Error(insertError.message);

      const procedureIds = (proceduresResult.data || []).map((p) => p.id);
      if (procedureIds.length) {
        await supabaseAdmin.from("patient_procedures").delete().in("id", procedureIds);
      }
      if (booking.preassessment_id) {
        await supabaseAdmin.from("patient_preassessment").delete().eq("id", booking.preassessment_id);
      }
      await supabaseAdmin.from("bookings").delete().eq("id", booking.id);

      archived += 1;
      details.push({ bookingId: booking.id, status: "archived" });
    } catch (err) {
      failed += 1;
      details.push({ bookingId: booking.id, status: "failed", reason: err.message });
    }
  }

  return { archived, failed, total: (oldBookings || []).length, details };
};

// Archives procedures once THEY turn 4 years old, based on their own
// created_at/updated_at — covers standalone procedures and procedures still
// attached to a booking that's recent enough to remain live (procedures tied
// to a booking that was just archived above are already gone by this point).
const archiveOldProcedures = async () => {
  const cutoff = getCutoffDate();

  const { data: procedures, error } = await supabaseAdmin
    .from("patient_procedures")
    .select("*");

  if (error) throw new Error(error.message);

  const eligible = (procedures || []).filter((p) => {
    const recordDate = p.updated_at || p.created_at;
    return recordDate && new Date(recordDate) < cutoff;
  });

  const patientIds = [...new Set(eligible.map((p) => p.patient_id).filter(Boolean))];
  let patientNameById = new Map();
  if (patientIds.length) {
    const usersResult = await supabaseAdmin.from("users").select("id, full_name").in("id", patientIds);
    if (!usersResult.error) {
      patientNameById = new Map((usersResult.data || []).map((u) => [u.id, u.full_name]));
    }
  }

  let archived = 0;
  let failed = 0;
  const details = [];

  for (const procedure of eligible) {
    try {
      const recordDate = procedure.updated_at || procedure.created_at;

      const { error: insertError } = await supabaseAdmin.from("archived_procedures").upsert({
        id: procedure.id,
        patient_id: procedure.patient_id || null,
        patient_name: patientNameById.get(procedure.patient_id) || null,
        procedure_name: procedure.procedure_name || null,
        booking_id: procedure.booking_id || null,
        record_date: recordDate ? String(recordDate).slice(0, 10) : null,
        data: { procedure },
      });
      if (insertError) throw new Error(insertError.message);

      await supabaseAdmin.from("patient_procedures").delete().eq("id", procedure.id);

      archived += 1;
      details.push({ procedureId: procedure.id, status: "archived" });
    } catch (err) {
      failed += 1;
      details.push({ procedureId: procedure.id, status: "failed", reason: err.message });
    }
  }

  return { archived, failed, total: eligible.length, details };
};

export const runArchiveSweep = async () => {
  // Order matters: dormant accounts first (they take their bookings and
  // procedures with them), then per-record passes for whatever's left on
  // still-active accounts.
  const accounts = await archiveDormantAccounts();
  const bookings = await archiveOldBookings();
  const procedures = await archiveOldProcedures();

  return {
    success: true,
    statusCode: 200,
    data: { accounts, bookings, procedures },
  };
};

export const listArchivedPatients = async (search = "") => {
  const { data, error } = await supabaseAdmin
    .from("archived_patients")
    .select("id, full_name, email, mobile, last_booking_date, archived_at")
    .order("archived_at", { ascending: false });

  if (error) {
    return { success: false, statusCode: 500, message: "Failed to load archived patients" };
  }

  const term = String(search || "").trim().toLowerCase();
  const rows = term
    ? (data || []).filter((row) =>
        String(row.full_name || "").toLowerCase().includes(term) ||
        String(row.email || "").toLowerCase().includes(term) ||
        String(row.mobile || "").includes(term)
      )
    : data || [];

  return { success: true, statusCode: 200, data: rows };
};

export const getArchivedPatientDetail = async (id) => {
  const { data, error } = await supabaseAdmin
    .from("archived_patients")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return { success: false, statusCode: 500, message: "Failed to load archived patient" };
  }
  if (!data) {
    return { success: false, statusCode: 404, message: "Archived patient not found" };
  }

  return {
    success: true,
    statusCode: 200,
    data: {
      id: data.id,
      fullName: data.full_name,
      email: data.email,
      mobile: data.mobile,
      lastBookingDate: data.last_booking_date,
      archivedAt: data.archived_at,
      ...data.data,
    },
  };
};

export const listArchivedBookings = async (search = "") => {
  const { data, error } = await supabaseAdmin
    .from("archived_bookings")
    .select("id, patient_id, patient_name, service, branch, appointment_date, archived_at")
    .order("appointment_date", { ascending: false });

  if (error) {
    return { success: false, statusCode: 500, message: "Failed to load archived bookings" };
  }

  const term = String(search || "").trim().toLowerCase();
  const rows = term
    ? (data || []).filter((row) =>
        String(row.patient_name || "").toLowerCase().includes(term) ||
        String(row.service || "").toLowerCase().includes(term)
      )
    : data || [];

  return { success: true, statusCode: 200, data: rows };
};

export const getArchivedBookingDetail = async (id) => {
  const { data, error } = await supabaseAdmin
    .from("archived_bookings")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return { success: false, statusCode: 500, message: "Failed to load archived booking" };
  }
  if (!data) {
    return { success: false, statusCode: 404, message: "Archived booking not found" };
  }

  return {
    success: true,
    statusCode: 200,
    data: {
      id: data.id,
      patientId: data.patient_id,
      patientName: data.patient_name,
      appointmentDate: data.appointment_date,
      archivedAt: data.archived_at,
      ...data.data,
    },
  };
};

export const listArchivedProcedures = async (search = "") => {
  const { data, error } = await supabaseAdmin
    .from("archived_procedures")
    .select("id, patient_id, patient_name, procedure_name, booking_id, record_date, archived_at")
    .order("record_date", { ascending: false });

  if (error) {
    return { success: false, statusCode: 500, message: "Failed to load archived procedures" };
  }

  const term = String(search || "").trim().toLowerCase();
  const rows = term
    ? (data || []).filter((row) =>
        String(row.patient_name || "").toLowerCase().includes(term) ||
        String(row.procedure_name || "").toLowerCase().includes(term)
      )
    : data || [];

  return { success: true, statusCode: 200, data: rows };
};

export const getArchivedProcedureDetail = async (id) => {
  const { data, error } = await supabaseAdmin
    .from("archived_procedures")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return { success: false, statusCode: 500, message: "Failed to load archived procedure" };
  }
  if (!data) {
    return { success: false, statusCode: 404, message: "Archived procedure not found" };
  }

  return {
    success: true,
    statusCode: 200,
    data: {
      id: data.id,
      patientId: data.patient_id,
      patientName: data.patient_name,
      procedureName: data.procedure_name,
      bookingId: data.booking_id,
      recordDate: data.record_date,
      archivedAt: data.archived_at,
      ...data.data,
    },
  };
};
