import { supabase } from './supabaseService';
import { getCurrentUser } from './supabaseService';
import { cancelOverdueAppointments } from './cancelOverdueAppointments';

function getLocalISODate() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isUuid(value) {
  if (!value) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value)
  );
}

function normalizeBranch(value) {
  return (value || "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/gc\s*dental\s*care/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

function branchMatches(left, right) {
  const a = normalizeBranch(left);
  const b = normalizeBranch(right);
  if (!a || !b) return false;
  return a === b || a.includes(b) || b.includes(a);
}

function isMissingTableError(error) {
  if (!error) return false;
  if (error.code === "PGRST205" || error.code === "42P01") return true;
  return String(error.message || "").toLowerCase().includes("does not exist");
}

function timeToMinutes(timeValue) {
  if (!timeValue) return null;
  const [h = "0", m = "0"] = String(timeValue).split(":");
  const hour = Number.parseInt(h, 10);
  const minute = Number.parseInt(m, 10);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
  return (hour * 60) + minute;
}

async function fetchBranchDelayMinutes(branch, effectiveDate) {
  try {
    const exact = await supabase
      .from('queue_delay_state')
      .select('branch, total_delay_minutes')
      .eq('branch', branch)
      .eq('effective_date', effectiveDate)
      .maybeSingle();

    if (exact.error && !isMissingTableError(exact.error)) {
      console.log('Delay exact lookup error:', exact.error);
      return 0;
    }

    if (exact.data) {
      return Number(exact.data.total_delay_minutes || 0);
    }

    // Fallback: branch names may have formatting differences.
    const byDate = await supabase
      .from('queue_delay_state')
      .select('branch, total_delay_minutes')
      .eq('effective_date', effectiveDate);

    if (byDate.error) {
      if (!isMissingTableError(byDate.error)) {
        console.log('Delay fallback lookup error:', byDate.error);
      }
      return 0;
    }

    const matched = (byDate.data || []).find((row) => branchMatches(row.branch, branch));
    return Number(matched?.total_delay_minutes || 0);
  } catch (error) {
    console.log('fetchBranchDelayMinutes error:', error);
    return 0;
  }
}

export const fetchUpcomingAppointment = async (profileId, options = {}) => {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return { data: null, error: null };
    }

    // Run overdue cancellation for this logged-in user/profile before reading upcoming.
    const cancelResult = await cancelOverdueAppointments({
      userId: user.id,
      profileId,
    });
    if (cancelResult?.error) {
      console.log('Auto-cancel skipped:', cancelResult.error);
    }

    // Get current date and time
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // YYYY-MM-DD format
    const currentTime = now.toTimeString().split(' ')[0]; // HH:MM:SS format

    console.log('Current date:', today);
    console.log('Current time:', currentTime);

    let query = supabase
      .from('bookings')
      .select(`
        *,
        dentist_list!inner(name, specialization)
      `)
      .in('status', ['pending', 'confirmed'])
      .or(`appointment_date.gt.${today},and(appointment_date.eq.${today},appointment_time.gt.${currentTime})`)
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true })
      .limit(1);

    const fallbackProfileName =
      typeof options?.profileName === 'string' ? options.profileName.trim() : '';

    // Filter by profile when possible.
    // If profile id is not a UUID (legacy local profile ids), narrow by patient_name to avoid
    // mixing multiple profiles under one account.
    if (isUuid(profileId)) {
      query = query.eq('profile_id', profileId);
    } else if (fallbackProfileName) {
      query = query.eq('patient_name', fallbackProfileName).eq('user_id', user.id);
    } else {
      query = query.eq('user_id', user.id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching upcoming appointment:', error);
      return { data: null, error: error.message };
    }

    console.log('Found appointments:', data);

    if (data && data.length > 0) {
      const appointment = data[0];
      
      // Format the appointment data
      const formattedAppointment = {
        id: appointment.id,
        doctorName: appointment.dentist_list.name,
        specialization: appointment.dentist_list.specialization,
        branch: appointment.branch,
        date: appointment.appointment_date,
        time: appointment.appointment_time,
        status: appointment.status
      };

      return { data: formattedAppointment, error: null };
    }

    return { data: null, error: null };
  } catch (err) {
    console.error('Error fetching upcoming appointment:', err);
    return { data: null, error: err.message };
  }
};

// Fetch queue details for a specific upcoming appointment.
export const fetchCurrentQueueForAppointment = async (appointment) => {
  try {
    if (!appointment?.id || !appointment?.branch || !appointment?.date) {
      return { data: null, error: null };
    }

    // Queue is only meaningful on the same day as the appointment.
    const today = getLocalISODate();
    if (appointment.date !== today) {
      return { data: null, error: null };
    }

    const { data, error } = await supabase
      .from('bookings')
      .select('id, appointment_time, created_at')
      .eq('branch', appointment.branch)
      .eq('appointment_date', appointment.date)
      .in('status', ['pending', 'confirmed'])
      .order('appointment_time', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching queue details:', error);
      return { data: null, error: error.message };
    }

    if (!data?.length) {
      return { data: null, error: null };
    }

    let index = data.findIndex((item) => item.id === appointment.id);

    // Fallback when the list changed and specific booking id is not found.
    if (index < 0 && appointment.time) {
      index = data.findIndex((item) => item.appointment_time === appointment.time);
    }

    if (index < 0) {
      return { data: null, error: null };
    }

    const queueNumber = index + 1;
    const ahead = Math.max(0, index);
    const queueWaitMinutes = ahead * 15;
    const now = new Date();
    const currentMinutes = (now.getHours() * 60) + now.getMinutes();
    const appointmentMinutes = timeToMinutes(appointment.time);

    // Time-based wait should reflect the actual appointment clock time.
    // Use queue wait as a fallback lower bound when appointment time is unavailable.
    const timeUntilAppointmentMinutes =
      appointmentMinutes === null ? 0 : Math.max(0, appointmentMinutes - currentMinutes);

    const baseWaitMinutes = Math.max(queueWaitMinutes, timeUntilAppointmentMinutes);
    const delayMinutes = await fetchBranchDelayMinutes(appointment.branch, appointment.date);
    const estimatedWaitMinutes = baseWaitMinutes + delayMinutes;

    return {
      data: {
        queueNumber,
        ahead,
        totalInQueue: data.length,
        baseWaitMinutes,
        delayMinutes,
        estimatedWaitMinutes,
        refreshedAt: Date.now(),
      },
      error: null,
    };
  } catch (err) {
    console.error('Error fetching queue details:', err);
    return { data: null, error: err.message };
  }
};

// Format date for display
export const formatAppointmentDate = (dateString) => {
  const date = new Date(dateString);
  const options = { 
    weekday: 'short', 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric' 
  };
  return date.toLocaleDateString('en-US', options);
};

// Convert 24-hour time to 12-hour format for display
export const formatAppointmentTime = (timeString) => {
  if (!timeString) return '';
  
  const [hours, minutes] = timeString.split(':');
  const hour24 = parseInt(hours, 10);
  const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
  const modifier = hour24 >= 12 ? 'PM' : 'AM';
  
  // Calculate end time (assuming 1.5 hour appointments)
  const endHour24 = hour24 + 1;
  const endMinutes = parseInt(minutes, 10) + 30;
  const actualEndHour = endMinutes >= 60 ? endHour24 + 1 : endHour24;
  const actualEndMinutes = endMinutes >= 60 ? endMinutes - 60 : endMinutes;
  
  const endHour12 = actualEndHour === 0 ? 12 : actualEndHour > 12 ? actualEndHour - 12 : actualEndHour;
  const endModifier = actualEndHour >= 12 ? 'PM' : 'AM';
  
  return `${hour12}:${minutes} ${modifier} - ${endHour12}:${actualEndMinutes.toString().padStart(2, '0')} ${endModifier}`;
};
