import { supabaseAdmin } from "../../shared/supabaseClient.js";

const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

/* =========================================================
   DATE HELPERS
========================================================= */

const toIsoDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

/* =========================================================
   TIME FORMATTER
========================================================= */

const toTimeLabel = (timeValue) => {
  if (!timeValue) return "-";

  const [rawHour = "0", rawMinute = "0"] = String(timeValue).split(":");

  const hour = Number.parseInt(rawHour, 10);
  const minute = Number.parseInt(rawMinute, 10);

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return "-";
  }

  const suffix = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;

  return `${hour12}:${String(minute).padStart(2, "0")} ${suffix}`;
};

/* =========================================================
   ADD SERVICE DURATION TO APPOINTMENT TIME

   service_duration from dental_services is expected
   to be stored in MINUTES.

   Example:
   09:00 + 30 minutes = 09:30 AM
   09:00 + 45 minutes = 09:45 AM
   09:00 + 60 minutes = 10:00 AM
   09:00 + 90 minutes = 10:30 AM
========================================================= */

const addMinutesToTime = (timeValue, durationMinutes = 60) => {
  if (!timeValue) return "-";

  const [rawHour = "0", rawMinute = "0"] = String(timeValue).split(":");

  const hour = Number.parseInt(rawHour, 10);
  const minute = Number.parseInt(rawMinute, 10);

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return "-";
  }

  const parsedDuration = Number.parseInt(durationMinutes, 10);

  const safeDuration =
    Number.isFinite(parsedDuration) && parsedDuration > 0
      ? parsedDuration
      : 60;

  const startMinutes = hour * 60 + minute;

  /*
   * % 1440 keeps the value valid even if an
   * appointment crosses midnight.
   */
  const endTotalMinutes = (startMinutes + safeDuration) % (24 * 60);

  const endHour = Math.floor(endTotalMinutes / 60);
  const endMinute = endTotalMinutes % 60;

  return toTimeLabel(
    `${String(endHour).padStart(2, "0")}:${String(endMinute).padStart(
      2,
      "0"
    )}`
  );
};

/* =========================================================
   STATUS MAPPING
========================================================= */

const toScheduleStatus = (status) => {
  const value = normalize(status);

  if (value === "completed") {
    return "completed";
  }

  if (value === "in_progress" || value === "in_treatment") {
    return "in_treatment";
  }

  if (value === "cancelled") {
    return "cancelled";
  }

  if (value === "confirmed") {
    return "waiting";
  }

  return "confirmed";
};

/* =========================================================
   DENTIST SCHEDULE
========================================================= */

export const getDentistSchedule = async (
  dentistProfileId,
  { date, branch }
) => {
  try {
    const targetDate = date || toIsoDate(new Date());

    /*
     * Load:
     *
     * 1. Dentist branches
     * 2. Dentist bookings
     * 3. Dental services with their service_duration
     *
     * No changes are required to the bookings table.
     */
    const [scheduleResult, bookingResult, servicesResult] =
      await Promise.all([
        supabaseAdmin
          .from("dentist_schedule")
          .select("branch")
          .eq("dentist_id", dentistProfileId)
          .eq("is_active", true),

        supabaseAdmin
          .from("bookings")
          .select(
            `
              id,
              patient_name,
              appointment_time,
              status,
              service,
              branch,
              appointment_date
            `
          )
          .eq("dentist_id", dentistProfileId)
          .eq("appointment_date", targetDate)
          .order("appointment_time", { ascending: true }),

        supabaseAdmin
          .from("dental_services")
          .select("id, name, service_duration"),
      ]);

    /* =====================================================
       ERROR HANDLING
    ===================================================== */

    if (scheduleResult.error) {
      console.error(
        "Dentist schedule branches error:",
        scheduleResult.error
      );

      return {
        success: false,
        statusCode: 500,
        message: "Failed to load dentist branches",
      };
    }

    if (bookingResult.error) {
      console.error(
        "Dentist bookings error:",
        bookingResult.error
      );

      return {
        success: false,
        statusCode: 500,
        message: "Failed to load schedule",
      };
    }

    if (servicesResult.error) {
      console.error(
        "Dental services error:",
        servicesResult.error
      );

      return {
        success: false,
        statusCode: 500,
        message: "Failed to load dental service durations",
      };
    }

    /* =====================================================
       CREATE SERVICE LOOKUP MAP
    ===================================================== */

    /*
     * Example:
     *
     * "oral prophylaxis" => {
     *   id: 1,
     *   name: "Oral Prophylaxis",
     *   service_duration: 45
     * }
     *
     * This allows bookings.service to remain unchanged.
     */
    const services = servicesResult.data || [];

    const servicesByName = new Map();

    services.forEach((service) => {
      const normalizedName = normalize(service.name);

      if (normalizedName) {
        servicesByName.set(normalizedName, service);
      }
    });

    /*
     * Also create an ID lookup.
     *
     * This makes the code work even if bookings.service
     * happens to contain the dental_services ID instead
     * of the service name.
     */
    const servicesById = new Map();

    services.forEach((service) => {
      if (service.id !== null && service.id !== undefined) {
        servicesById.set(String(service.id), service);
      }
    });

    /* =====================================================
       BRANCHES
    ===================================================== */

    const scheduleBranches = [
      ...new Set(
        (scheduleResult.data || [])
          .map((item) => item.branch)
          .filter(Boolean)
      ),
    ];

    const bookingBranches = [
      ...new Set(
        (bookingResult.data || [])
          .map((item) => item.branch)
          .filter(Boolean)
      ),
    ];

    const branches = [
      ...new Set([...scheduleBranches, ...bookingBranches]),
    ];

    /* =====================================================
       APPOINTMENTS
    ===================================================== */

    const normalizedBranch = normalize(branch);

    const appointments = (bookingResult.data || [])
      .filter((item) =>
        normalizedBranch
          ? normalize(item.branch) === normalizedBranch
          : true
      )

      /*
       * Preserve your current behavior:
       * cancelled appointments are not displayed.
       */
      .filter(
        (item) => normalize(item.status) !== "cancelled"
      )

      .map((item) => {
        /*
         * First try matching bookings.service with
         * dental_services.name.
         */
        let matchedService =
          servicesByName.get(normalize(item.service)) || null;

        /*
         * If no name match exists, also check whether
         * bookings.service contains the service ID.
         */
        if (!matchedService && item.service !== null) {
          matchedService =
            servicesById.get(String(item.service)) || null;
        }

        /*
         * Obtain service_duration from dental_services.
         *
         * 60 minutes is only used as a safe fallback for
         * old or unmatched booking records.
         */
        const rawDuration = Number(
          matchedService?.service_duration
        );

        const serviceDuration =
          Number.isFinite(rawDuration) && rawDuration > 0
            ? rawDuration
            : 60;

        const startTime = toTimeLabel(
          item.appointment_time
        );

        const endTime = addMinutesToTime(
          item.appointment_time,
          serviceDuration
        );

        return {
          id: item.id,

          patientName:
            item.patient_name || "Unknown Patient",

          startTime,

          /*
           * This is now calculated using
           * dental_services.service_duration instead
           * of automatically adding one hour.
           */
          endTime,

          status: toScheduleStatus(item.status),

          service:
            matchedService?.name ||
            item.service ||
            "Dental Appointment",

          /*
           * Included in the API response for future use.
           * It does not change the current UI.
           */
          serviceDuration,

          branch: item.branch || "-",

          date: item.appointment_date,
        };
      });

    /* =====================================================
       RESPONSE
    ===================================================== */

    return {
      success: true,
      statusCode: 200,

      data: {
        selectedDate: targetDate,

        branches,

        appointments,

        notifications: appointments
          .slice(0, 6)
          .map((item, index) => ({
            id: item.id || index + 1,
            title: "Schedule Reminder",
            message: `${item.patientName} • ${item.service}`,
            time: item.startTime,
          })),
      },
    };
  } catch (error) {
    console.error(
      "Get dentist schedule error:",
      error
    );

    return {
      success: false,
      statusCode: 500,
      message:
        error?.message || "Failed to load schedule",
    };
  }
};