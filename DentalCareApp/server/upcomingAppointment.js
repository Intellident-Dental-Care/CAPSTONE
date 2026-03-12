import { supabase } from './supabaseService';
import { getCurrentUser } from './supabaseService';

export const fetchUpcomingAppointment = async (profileId) => {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return { data: null, error: null };
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
      .eq('status', 'pending')
      .or(`appointment_date.gt.${today},and(appointment_date.eq.${today},appointment_time.gt.${currentTime})`)
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true })
      .limit(1);

    // Filter by profile if provided, otherwise fall back to user_id
    if (profileId) {
      query = query.eq('profile_id', profileId);
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
