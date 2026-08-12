import { supabase } from './supabaseService';
import { getCurrentUser } from './supabaseService';

function isUuid(value) {
  if (!value) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value)
  );
}

function toDateTime(dateString, timeString) {
  if (!dateString || !timeString) return null;

  const normalizedTime = String(timeString).length === 5
    ? `${timeString}:00`
    : String(timeString);

  const value = new Date(`${dateString}T${normalizedTime}`);
  return Number.isNaN(value.getTime()) ? null : value;
}

export const cancelOverdueAppointments = async ({ userId, profileId } = {}) => {
  try {
    const now = new Date();
    const user = userId ? { id: userId } : await getCurrentUser();

    if (!user?.id) {
      return { updatedCount: 0, updatedIds: [], error: 'No logged-in user.' };
    }

    let fetchQuery = supabase
      .from('bookings')
      .select('id, appointment_date, appointment_time, status, user_id, profile_id')
      .eq('user_id', user.id)
      .eq('status', 'pending');

    if (isUuid(profileId)) {
      fetchQuery = fetchQuery.eq('profile_id', profileId);
    }

    const { data, error } = await fetchQuery;

    if (error) {
      console.error('Error fetching bookings to auto-cancel:', error);
      return { updatedCount: 0, updatedIds: [], error: error.message };
    }

    const overdueIds = (data || [])
      .filter((booking) => {
        const appointmentAt = toDateTime(
          booking.appointment_date,
          booking.appointment_time
        );
        if (!appointmentAt) return false;

        const cancelAt = new Date(appointmentAt.getTime() + 60 * 60 * 1000);
        return now >= cancelAt;
      })
      .map((booking) => booking.id);

    if (!overdueIds.length) {
      return { updatedCount: 0, updatedIds: [], error: null };
    }

    let updateQuery = supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .in('id', overdueIds)
      .eq('user_id', user.id)
      .eq('status', 'pending');

    if (isUuid(profileId)) {
      updateQuery = updateQuery.eq('profile_id', profileId);
    }

    const { error: updateError } = await updateQuery;

    if (updateError) {
      console.error('Error updating overdue bookings:', updateError);
      return { updatedCount: 0, updatedIds: [], error: updateError.message };
    }

    return {
      updatedCount: overdueIds.length,
      updatedIds: overdueIds,
      error: null,
    };
  } catch (err) {
    console.error('Error in cancelOverdueAppointments:', err);
    return { updatedCount: 0, updatedIds: [], error: err.message };
  }
};