// app/booking/appointment.js

import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform, ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { colors } from "../theme/colors";
import DateTimePicker from "@react-native-community/datetimepicker";
import PinkAlert from "../components/PinkAlert";
import { supabase } from "../../server/supabaseService";
import { getCurrentUser } from "../../server/supabaseService";
import { getCurrentActiveProfileForSession, getPatientProfileByProfileId } from "../_storage/authStorage";
import { clearAppointmentCacheForProfile, appointmentsListCache } from "../_storage/profileCache";

/* ---------- helpers ---------- */
function monthShort(d) {
  return d.toLocaleString("en-US", { month: "short" }).toUpperCase();
}
function pad2(n) {
  return String(n).padStart(2, "0");
}
function toISODate(d) {
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  return `${y}-${m}-${day}`;
}

function getCurrentMinutesOfDay() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function formatMonthDay(d) {
  return `${monthShort(d)} ${pad2(d.getDate())}`;
}

function getWeekdayFromISO(iso) {
  if (!iso) return null;
  return new Date(`${iso}T00:00:00`).getDay();
}

function parseTimeToMinutes(timeValue) {
  if (!timeValue) return null;
  const [timePart, meridiem] = String(timeValue).split(" ");
  let [hours, minutes] = timePart.split(":").map(Number);

  if (meridiem === "PM" && hours !== 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

function minutesTo12Hour(totalMinutes) {
  const hour24 = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const suffix = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:${pad2(minutes)} ${suffix}`;
}

function intervalsOverlap(startA, endA, startB, endB) {
  return startA < endB && startB < endA;
}

function buildBlockedSlotsByDelay({
  candidateSlots,
  bookedTimes12h,
  slotDurationMinutes,
  queueDelayMinutes,
}) {
  if (!Array.isArray(candidateSlots) || !candidateSlots.length) return new Set();
  if (!Array.isArray(bookedTimes12h) || !bookedTimes12h.length) return new Set();
  if ((queueDelayMinutes || 0) <= 30) return new Set();

  const blocked = new Set();

  const bookedIntervals = bookedTimes12h
    .map((label) => {
      const bookedStart = parseTimeToMinutes(convertTo24Hour(label));
      if (bookedStart === null) return null;
      const bookedEnd = bookedStart + slotDurationMinutes + queueDelayMinutes;
      return { start: bookedStart, end: bookedEnd };
    })
    .filter(Boolean);

  candidateSlots.forEach((candidateLabel) => {
    const candidateStart = parseTimeToMinutes(convertTo24Hour(candidateLabel));
    if (candidateStart === null) return;

    const candidateEnd = candidateStart + slotDurationMinutes;
    const hasOverlap = bookedIntervals.some((interval) =>
      intervalsOverlap(candidateStart, candidateEnd, interval.start, interval.end)
    );

    if (hasOverlap) blocked.add(candidateLabel);
  });

  return blocked;
}

function buildSlotsForDate(scheduleRows, isoDate) {
  const weekday = getWeekdayFromISO(isoDate);
  if (weekday === null) return [];

  const todayIso = toISODate(new Date());
  const isToday = isoDate === todayIso;
  const currentMinutes = getCurrentMinutesOfDay();

  const rowsForDay = (scheduleRows || []).filter(
    (row) => Number(row.day_of_week) === weekday
  );

  const slotSet = new Set();
  rowsForDay.forEach((row) => {
    const start = parseTimeToMinutes(row.start_time);
    const end = parseTimeToMinutes(row.end_time);
    const step = Number(row.slot_minutes) || 30;

    if (start === null || end === null || end <= start || step <= 0) return;

    for (let minutes = start; minutes + step <= end; minutes += step) {
      if (isToday && minutes <= currentMinutes) continue;
      slotSet.add(minutesTo12Hour(minutes));
    }
  });

  return Array.from(slotSet).sort((a, b) => {
    const aMinutes = parseTimeToMinutes(convertTo24Hour(a));
    const bMinutes = parseTimeToMinutes(convertTo24Hour(b));
    return (aMinutes || 0) - (bMinutes || 0);
  });
}

function buildAvailableDates(scheduleRows, horizonDays = 45, maxDates = 10) {
  const allowedDays = new Set(
    (scheduleRows || []).map((row) => Number(row.day_of_week))
  );
  if (!allowedDays.size) return [];

  const base = new Date();
  base.setHours(0, 0, 0, 0);

  const out = [];
  for (let i = 0; i < horizonDays && out.length < maxDates; i += 1) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    d.setHours(0, 0, 0, 0);

    if (!allowedDays.has(d.getDay())) continue;

    const iso = toISODate(d);
    const hasBookableSlots = buildSlotsForDate(scheduleRows, iso).length > 0;
    if (!hasBookableSlots) continue;

    out.push({ iso, label: formatMonthDay(d) });
  }

  return out;
}

function isUuid(value) {
  if (!value) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value)
  );
}

function isMissingServiceColumnError(error) {
  const message = String(error?.message || "");
  return error?.code === "PGRST204" && message.includes("'service' column");
}

// Convert 12-hour format to 24-hour format for database storage
function convertTo24Hour(time12h) {
  const [time, modifier] = time12h.split(' ');
  let [hours, minutes] = time.split(':');
  
  if (hours === '12') {
    hours = '00';
  }
  
  if (modifier === 'PM') {
    hours = parseInt(hours, 10) + 12;
  }
  
  return `${pad2(hours)}:${minutes}:00`;
}

// Convert 24-hour format to 12-hour format for display
function convertTo12Hour(time24h) {
  if (!time24h) return '';
  
  const [hours, minutes] = time24h.split(':');
  const hour24 = parseInt(hours, 10);
  const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
  const modifier = hour24 >= 12 ? 'PM' : 'AM';
  
  return `${hour12}:${minutes} ${modifier}`;
}

/* ---------- component ---------- */
export default function BookingAppointment() {
  const router = useRouter();
  const { service, branch, doctor, doctorId, preassessmentId, bookingId, editMode, originalDate, originalTime } = useLocalSearchParams();

  const selectedDoctorId =
    typeof doctorId === "string" && doctorId.length ? doctorId : "";
  const isEditMode = editMode === "true";
  const existingBookingId = typeof bookingId === "string" ? bookingId : null;

  const [showAlert, setShowAlert] = useState(false);
  const [dentistData, setDentistData] = useState(null);
  const [dentistSchedules, setDentistSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [bookedTimeSlots, setBookedTimeSlots] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [queueDelayMinutes, setQueueDelayMinutes] = useState(0);

  const [datePills, setDatePills] = useState([]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [selectedISO, setSelectedISO] = useState(
    isEditMode && typeof originalDate === "string" ? originalDate : ""
  );
  const [selectedLabel, setSelectedLabel] = useState("");

  const [selectedTime, setSelectedTime] = useState(
    isEditMode && typeof originalTime === "string" ? convertTo12Hour(originalTime) : ""
  );
  const [timeTab, setTimeTab] = useState("Morning");

  const [showCalendar, setShowCalendar] = useState(false);
  const [pickedDate, setPickedDate] = useState(today);

  const availableSlots = useMemo(
    () => buildSlotsForDate(dentistSchedules, selectedISO),
    [dentistSchedules, selectedISO]
  );

  const slotDurationMinutes = useMemo(() => {
    const values = (dentistSchedules || [])
      .map((row) => Number(row.slot_minutes) || 0)
      .filter((v) => v > 0);
    if (!values.length) return 60;
    return Math.min(...values);
  }, [dentistSchedules]);

  const delayBlockedSlots = useMemo(
    () =>
      buildBlockedSlotsByDelay({
        candidateSlots: availableSlots,
        bookedTimes12h: bookedTimeSlots,
        slotDurationMinutes,
        queueDelayMinutes,
      }),
    [availableSlots, bookedTimeSlots, slotDurationMinutes, queueDelayMinutes]
  );

  const unbookableSlots = useMemo(() => {
    const combined = new Set(bookedTimeSlots);
    delayBlockedSlots.forEach((slot) => combined.add(slot));
    return combined;
  }, [bookedTimeSlots, delayBlockedSlots]);

  const timesMorning = useMemo(
    () =>
      availableSlots.filter((timeLabel) => {
        const hour = Number.parseInt(convertTo24Hour(timeLabel).split(":")[0], 10);
        return hour < 12;
      }),
    [availableSlots]
  );

  const timesAfternoon = useMemo(
    () =>
      availableSlots.filter((timeLabel) => {
        const hour = Number.parseInt(convertTo24Hour(timeLabel).split(":")[0], 10);
        return hour >= 12;
      }),
    [availableSlots]
  );

  const times = timeTab === "Morning" ? timesMorning : timesAfternoon;

  useEffect(() => {
    fetchDentistData();
  }, [doctor, selectedDoctorId, branch]);

  useEffect(() => {
    if (dentistData && selectedISO && branch) {
      fetchBookedTimeSlots();
      return;
    }

    setBookedTimeSlots([]);
  }, [dentistData, selectedISO, branch]);

  useEffect(() => {
    if (!selectedISO || !branch) {
      setQueueDelayMinutes(0);
      return;
    }

    fetchQueueDelayState();
  }, [selectedISO, branch]);

  useEffect(() => {
    const nextDates = buildAvailableDates(dentistSchedules, 45, 10);
    setDatePills(nextDates);

    if (!nextDates.length) {
      setSelectedISO("");
      setSelectedLabel("");
      setSelectedTime("");
      return;
    }

    const selectedStillValid = nextDates.some((d) => d.iso === selectedISO);
    if (selectedStillValid) return;

    setSelectedISO(nextDates[0].iso);
    setSelectedLabel(nextDates[0].label);
    setPickedDate(new Date(`${nextDates[0].iso}T00:00:00`));
  }, [dentistSchedules, selectedISO]);

  useEffect(() => {
    const allTimes = [...timesMorning, ...timesAfternoon];

    if (!allTimes.length) {
      if (selectedTime) setSelectedTime("");
      return;
    }

    if (timeTab === "Morning" && !timesMorning.length && timesAfternoon.length) {
      setTimeTab("Afternoon");
      return;
    }

    if (timeTab === "Afternoon" && !timesAfternoon.length && timesMorning.length) {
      setTimeTab("Morning");
      return;
    }

    if (!allTimes.includes(selectedTime)) {
      setSelectedTime(allTimes[0]);
    }
  }, [timeTab, timesMorning, timesAfternoon, selectedTime]);

  const fetchDentistData = async () => {
    if (!doctor && !selectedDoctorId) return;
    
    try {
      setLoading(true);
      let dentistQuery = supabase.from("dentist_list").select("*");
      dentistQuery = selectedDoctorId
        ? dentistQuery.eq("id", selectedDoctorId)
        : dentistQuery.eq("name", doctor);

      const { data, error } = await dentistQuery.single();
      if (error) throw error;

      const { data: scheduleData, error: scheduleError } = await supabase
        .from("dentist_schedule")
        .select("id, branch, day_of_week, start_time, end_time, slot_minutes")
        .eq("dentist_id", data.id)
        .eq("branch", branch)
        .eq("is_active", true)
        .order("day_of_week", { ascending: true });

      if (scheduleError) throw scheduleError;

      setDentistData(data);
      setDentistSchedules(scheduleData || []);
    } catch (err) {
      console.error('Error fetching dentist:', err);
      setDentistSchedules([]);
      Alert.alert("Error", "Failed to load dentist schedule.");
    } finally {
      setLoading(false);
    }
  };

  const fetchBookedTimeSlots = async () => {
    if (!dentistData || !selectedISO || !branch) return;

    try {
      // Safely fetch ALL bookings for this date and branch to bypass DB case-sensitivity issues
      const { data, error } = await supabase
        .from('bookings')
        .select('id, appointment_time, branch, dentist_id, appointment_date, status')
        .eq('dentist_id', dentistData.id)
        .eq('appointment_date', selectedISO)
        .eq('branch', branch);

      if (error) throw error;

      // Filter statuses in javascript to ensure 'Pending', 'pending', 'PENDING' all get caught
      const activeBookings = (data || []).filter(booking => {
        // If we are rescheduling our own slot, it shouldn't block us from choosing the same time
        if (isEditMode && booking.id === existingBookingId) return false;
        
        const status = (booking.status || '').toLowerCase();
        return ['pending', 'confirmed', 'in_treatment', 'in treatment', 'in-treatment'].includes(status);
      });

      // Convert times securely
      const bookedTimes = activeBookings.map(booking => {
        return convertTo12Hour(booking.appointment_time);
      }).filter(Boolean);

      setBookedTimeSlots(bookedTimes);
    } catch (err) {
      console.error('Error fetching booked time slots:', err);
      setBookedTimeSlots([]);
    }
  };

  const fetchQueueDelayState = async () => {
    try {
      const { data, error } = await supabase
        .from('queue_delay_state')
        .select('total_delay_minutes')
        .eq('branch', branch)
        .eq('effective_date', selectedISO)
        .maybeSingle();

      if (error) throw error;

      const delay = Number(data?.total_delay_minutes) || 0;
      setQueueDelayMinutes(Math.max(0, delay));
    } catch (err) {
      console.error('Error fetching queue delay state:', err);
      setQueueDelayMinutes(0);
    }
  };

  const onPickDate = (event, date) => {
    if (Platform.OS !== "ios") setShowCalendar(false);

    if (event?.type === "dismissed" || !date) return;

    date.setHours(0, 0, 0, 0);
    const weekday = date.getDay();
    const branchHasSchedule = dentistSchedules.some(
      (row) => Number(row.day_of_week) === weekday
    );

    const iso = toISODate(date);
    const hasBookableSlots = buildSlotsForDate(dentistSchedules, iso).length > 0;

    if (!branchHasSchedule || !hasBookableSlots) {
      Alert.alert(
        "No Schedule",
        iso === toISODate(new Date())
          ? "No available times left for today. Please choose another date."
          : "This dentist is not available at this branch on the selected day."
      );
      if (Platform.OS === "ios") setShowCalendar(false);
      return;
    }

    setPickedDate(date);
    const label = formatMonthDay(date);

    setSelectedISO(iso);
    setSelectedLabel(label);

    setDatePills((prev) => {
      const exists = prev.some((p) => p.iso === iso);
      if (exists) return prev;

      const next = [...prev, { iso, label }].sort((a, b) =>
        a.iso.localeCompare(b.iso)
      );

      if (next.length > 10) next.shift();
      return next;
    });

    if (Platform.OS === "ios") setShowCalendar(false);
  };

  const handleBooking = async () => {
    if (booking) return;
    if (!dentistData || !selectedISO || !selectedTime) {
      Alert.alert("Incomplete Booking", "Please choose an available date and time first.");
      return;
    }

    if (!availableSlots.includes(selectedTime)) {

          if (unbookableSlots.has(selectedTime)) {
            Alert.alert(
              "Unavailable",
              "Selected time is unavailable due to current queue delay or existing booking."
            );
            return;
          }
      Alert.alert(
        "Unavailable Time",
        "The selected time is not available for this dentist at this branch."
      );
      return;
    }

    setBooking(true);

    try {
      const user = await getCurrentUser();

      // Get active profile for patient name and profile_id
      const activeProfile = await getCurrentActiveProfileForSession();
      const patientProfile = activeProfile
        ? await getPatientProfileByProfileId(activeProfile.id)
        : null;
      const patientName =
        patientProfile?.fullName || activeProfile?.name || user?.email || "";
      const profileId = isUuid(activeProfile?.id) ? activeProfile.id : null;

      const time24h = convertTo24Hour(selectedTime);

      // --- 100% BULLETPROOF DUPLICATE CHECK ---
      const { data: existingBookings } = await supabase
        .from('bookings')
        .select('id, appointment_time, status')
        .eq('dentist_id', dentistData.id)
        .eq('appointment_date', selectedISO)
        .eq('branch', branch);

      // Safely check for time conflicts using JS matching to bypass time-zone/format bugs
      const isSlotTaken = (existingBookings || []).some(b => {
        if (isEditMode && b.id === existingBookingId) return false;
        
        const st = (b.status || '').toLowerCase();
        const isActiveStatus = ['pending', 'confirmed', 'in_treatment', 'in treatment', 'in-treatment'].includes(st);
        
        // Convert the DB time securely so 09:30:00 matches "9:30 AM" perfectly
        const dbTime12h = convertTo12Hour(b.appointment_time);
        
        return isActiveStatus && dbTime12h === selectedTime;
      });

      if (isSlotTaken) {
        Alert.alert('Time Slot Unavailable', 'This time slot is already booked by another patient. Please select a different time.');
        setBooking(false);
        await fetchBookedTimeSlots();
        return;
      }

      // Check if this specific profile/user already has a booking with this doctor on this date
      let dupQuery = supabase
        .from('bookings')
        .select('id, status')
        .eq('dentist_id', dentistData.id)
        .eq('appointment_date', selectedISO);

      dupQuery = profileId
        ? dupQuery.eq('profile_id', profileId)
        : dupQuery.eq('user_id', user.id);

      const { data: userExistingBookings } = await dupQuery;
      
      const hasActiveExisting = (userExistingBookings || []).some(b => {
        if (isEditMode && b.id === existingBookingId) return false;
        const st = (b.status || '').toLowerCase();
        return ['pending', 'confirmed'].includes(st);
      });

      if (hasActiveExisting) {
        Alert.alert('Booking Exists', 'You already have a booking with this doctor on this date.');
        setBooking(false);
        return;
      }

      // Pre-assessment is optional. Link it only when a valid UUID is provided.
      const safePreassessmentId = isUuid(preassessmentId) ? preassessmentId : null;

      const bookingData = {
        user_id: user.id,
        profile_id: profileId,
        patient_name: patientName,
        service: service || null,
        dentist_id: dentistData.id,
        branch: branch,
        appointment_date: selectedISO,
        appointment_time: time24h,
        preassessment_id: safePreassessmentId,
        status: 'pending' // Enforced lowercase insertion
      };

      let error;

      if (isEditMode && existingBookingId) {
        // UPDATE existing booking (reschedule)
        const updateData = {
          appointment_date: selectedISO,
          appointment_time: time24h,
          status: 'pending'
        };

        const { error: updateError } = await supabase
          .from('bookings')
          .update(updateData)
          .eq('id', existingBookingId);

        error = updateError;
      } else {
        // CREATE new booking
        const { error: insertError } = await supabase
          .from('bookings')
          .insert([bookingData]);

        // Backward compatibility: some DBs still don't have bookings.service.
        if (isMissingServiceColumnError(insertError)) {
          const { service: _unusedService, ...legacyBookingData } = bookingData;
          const retry = await supabase
            .from('bookings')
            .insert([legacyBookingData]);
          error = retry.error;
        } else {
          error = insertError;
        }
      }

      if (error) throw error;

      // Invalidate cached appointment cards/lists so Home and Appointments refresh immediately.
      const cacheKey = profileId || '__no_profile__';
      clearAppointmentCacheForProfile(cacheKey);
      delete appointmentsListCache[cacheKey];

      setShowAlert(true);
    } catch (err) {
      console.error('Error creating booking:', err);
      Alert.alert('Error', 'Failed to create booking. Please try again.');
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 10, fontSize: 14, color: colors.textGray }}>Loading doctor details...</Text>
      </View>
    );
  }

  const handleConfirmBooking = () => {
    setShowPreview(false);
    setShowAlert(true);
  };

  const hasDateAvailability = datePills.length > 0;
  const hasTimeAvailability = availableSlots.length > 0;
  const canBookNow =
    !booking && hasDateAvailability && hasTimeAvailability && !!selectedISO && !!selectedTime;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={colors.primary} />
        </Pressable>

        <View style={styles.headerRight}>
          <Ionicons name="heart-outline" size={18} color={colors.primary} />
          <Ionicons
            name="share-social-outline"
            size={18}
            color={colors.primary}
          />
        </View>
      </View>

      <View style={styles.doctorRow}>
        <View style={styles.docPic}>
          <Ionicons name="person" size={22} color={colors.primary} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.docName}>{dentistData?.name || doctor || "Doctor"}</Text>
          <Text style={styles.docSub}>{dentistData?.specialization || "Orthodontics"}</Text>
          <Text style={styles.docSub}>{branch || "Branch"}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <Stat label="Experience" value={`${dentistData?.experience_years || 14} years`} />
        <Stat label="Patients" value={dentistData?.total_patients || "1234"} />
        <Stat label="Success Rate" value={`${dentistData?.success_rate || 99.9}%`} />
      </View>

      <View style={styles.tabsRow}>
        <Text style={[styles.tab, styles.tabActive]}>Schedules</Text>
        <Text style={styles.tab}>About</Text>
        <Text style={styles.tab}>Experiences</Text>
        <Text style={styles.tab}>Specialization</Text>
      </View>
      <View style={styles.tabLine} />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 105 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.section}>Date</Text>

        {hasDateAvailability ? (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 10 }}
            >
              {(Array.isArray(datePills) ? datePills : []).map((d) => {
                const active = d.iso === selectedISO;
                return (
                  <Pressable
                    key={d.iso}
                    style={[styles.datePill, active && styles.datePillActive]}
                    onPress={() => {
                      setSelectedISO(d.iso);
                      setSelectedLabel(d.label);
                    }}
                  >
                    <Text style={[styles.dateText, active && { color: "#fff" }]}>
                      {d.label}
                    </Text>
                  </Pressable>
                );
              })}

              <Pressable
                style={[styles.datePill, styles.calendarPill]}
                onPress={() => setShowCalendar(true)}
              >
                <Ionicons
                  name="calendar-outline"
                  size={18}
                  color={colors.primary}
                />
              </Pressable>
            </ScrollView>

            {showCalendar && (
              <DateTimePicker
                value={pickedDate}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "calendar"}
                onChange={onPickDate}
                accentColor={colors.primary}
              />
            )}
          </>
        ) : (
          <Text style={styles.noScheduleText}>
            No available schedule for this dentist at {branch || "this branch"}.
          </Text>
        )}

        <Text style={[styles.section, { marginTop: 18 }]}>Time</Text>

        <View style={styles.timeTabs}>
          <Pressable
            style={[
              styles.timeTab,
              timeTab === "Morning" && styles.timeTabActive,
              !timesMorning.length && { opacity: 0.45 },
            ]}
            onPress={() => {
              if (timesMorning.length) setTimeTab("Morning");
            }}
          >
            <Text
              style={[
                styles.timeTabText,
                timeTab === "Morning" && { color: "#fff" },
              ]}
            >
              Morning
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.timeTab,
              timeTab === "Afternoon" && styles.timeTabActive,
              !timesAfternoon.length && { opacity: 0.45 },
            ]}
            onPress={() => {
              if (timesAfternoon.length) setTimeTab("Afternoon");
            }}
          >
            <Text
              style={[
                styles.timeTabText,
                timeTab === "Afternoon" && { color: "#fff" },
              ]}
            >
              Afternoon
            </Text>
          </Pressable>
        </View>

        <View style={styles.timeGrid}>
          {times.map((t) => {
            const active = t === selectedTime;
            const isBooked = unbookableSlots.has(t);

            return (
              <Pressable
                key={t}
                style={[
                  styles.timeBox, 
                  active && !isBooked && styles.timeBoxActive,
                  isBooked && styles.timeBoxBooked
                ]}
                onPress={() => {
                  if (!isBooked) {
                    setSelectedTime(t);
                  }
                }}
                disabled={isBooked}
              >
                <Text style={[
                  styles.timeText, 
                  active && !isBooked && { color: "#fff" },
                  isBooked && styles.timeTextBooked
                ]}>
                  
                  {t}
                
                </Text>
                {isBooked && (
                  <Text style={styles.bookedLabel}>Booked</Text>
                )}
              </Pressable>
            );
          })}
        </View>

        {!times.length && hasDateAvailability && (
          <Text style={styles.noScheduleText}>
            No time slots available for the selected date at this branch.
          </Text>
        )}

        {bookedTimeSlots.length > 0 && (
          <Text style={styles.bookedInfo}>
            * Grayed out times are already booked for this doctor and branch
          </Text>
        )}
      </ScrollView>

      {/* Book Now */}
      <Pressable 
        style={[styles.bookBtn, !canBookNow && { opacity: 0.5 }]} 
        onPress={handleBooking}
        disabled={!canBookNow}
      >
        <Text style={styles.bookText}>
          {booking ? "Booking..." : "Book Now"}
        </Text>
      </Pressable>

      <Modal
        visible={showPreview}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPreview(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowPreview(false)}
        >
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>Booking Preview</Text>
            <Text style={styles.modalSubtitle}>
              Please review your appointment details before confirming.
            </Text>

            <View style={styles.previewBox}>
              <PreviewRow label="Service" value={service || "No service selected"} />
              <PreviewRow label="Doctor" value={doctor || "No doctor selected"} />
              <PreviewRow label="Branch" value={branch || "No branch selected"} />
              <PreviewRow label="Date" value={selectedLabel} />
              <PreviewRow label="Time" value={selectedTime} />
            </View>

            <Pressable
              style={styles.confirmBtn}
              onPress={handleConfirmBooking}
            >
              <Text style={styles.confirmText}>Confirm Booking</Text>
            </Pressable>

            <Pressable
              style={styles.cancelBtn}
              onPress={() => setShowPreview(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <PinkAlert
        visible={showAlert}
        title="Booking Confirmed!"
        message={`Your appointment for ${service || "Dental Service"} with ${
          doctor || "Doctor"
        } at ${branch || "Branch"} is booked on ${selectedLabel} at ${selectedTime}.`}
        onClose={() => {
          setShowAlert(false);
          router.replace("/home");
        }}
      />
    </View>
  );
}

function Stat({ label, value }) {
  return (
    <View style={{ alignItems: "center" }}>
      <Text style={{ fontSize: 12, fontWeight: "900", color: "#666" }}>
        {value}
      </Text>
      <Text style={{ fontSize: 9, color: colors.textGray }}>{label}</Text>
    </View>
  );
}

function PreviewRow({ label, value }) {
  return (
    <View style={styles.previewRow}>
      <Text style={styles.previewLabel}>{label}</Text>
      <Text style={styles.previewValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 16,
    paddingHorizontal: 18,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  headerRight: {
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
  },

  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },


  doctorRow: {
    marginTop: 6,
    marginLeft: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  docPic: {
    width: 77,
    height: 83,
    borderRadius: 12,
    backgroundColor: "#eee",
    alignItems: "center",
    justifyContent: "center",
  },

  docName: {
    fontSize: 17,
    fontWeight: "900",
    color: colors.primary,
  },

  docSub: {
    marginTop: 2,
    fontSize: 12,
    color: colors.textGray,
  },

  statsRow: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-around",
  },

  tabsRow: {
    marginTop: 22,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  tab: {
    fontSize: 11,
    color: colors.textGray,
  },

  tabActive: {
    color: colors.primary,
    fontWeight: "900",
  },

  tabLine: {
    marginTop: 8,
    height: 1,
    backgroundColor: "#eee",
  },

  section: {
    marginTop: 14,
    marginBottom: 12,
    fontSize: 14,
    fontWeight: "900",
    color: colors.primary,
  },

  datePill: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#EDEDED",
    alignItems: "center",
    justifyContent: "center",
  },

  datePillActive: {
    backgroundColor: colors.primary,
  },

  dateText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#777",
  },

  calendarPill: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.primary,
  },

  timeTabs: {
    marginTop: 10,
    height: 38,
    borderRadius: 20,
    backgroundColor: "#F3F3F3",
    flexDirection: "row",
    padding: 3,
  },

  timeTab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
  },

  timeTabActive: {
    backgroundColor: colors.primary,
  },

  timeTabText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#777",
  },

  timeGrid: {
    marginTop: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  timeBox: {
    width: "48%",
    minHeight: 46,
    borderRadius: 14,
    backgroundColor: "#F8F8F8",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#EFEFEF",
  },

  timeBoxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  timeText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#666",
  },

  timeBoxBooked: {
    backgroundColor: "#F3F3F3",
    borderWidth: 1,
    borderColor: "#E1E1E1",
  },

 timeTextBooked: {
  color: "#AAAAAA",
},

bookedLabel: {
  marginTop: 2,
  fontSize: 8.5,
  fontWeight: "900",
  color: "#B04B65",
},
  bookedInfo: {
    marginTop: 10,
    fontSize: 10,
    color: colors.textGray,
    fontWeight: "700",
  },

  noScheduleText: {
    marginTop: 4,
    fontSize: 11,
    color: colors.textGray,
    fontWeight: "700",
  },


bookBtn: {
  position: "absolute",
  bottom: 28,
  alignSelf: "center",
  width: 160,
  height: 44,
  borderRadius: 22,
  backgroundColor: colors.primary,
  alignItems: "center",
  justifyContent: "center",
  shadowColor: "#000",
  shadowOpacity: 0.15,
  shadowRadius: 10,
  elevation: 4,
},


  bookText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "900",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  modalCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 22,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.primary,
    textAlign: "center",
    marginBottom: 8,
  },

  modalSubtitle: {
    fontSize: 12,
    color: colors.textGray,
    textAlign: "center",
    marginBottom: 16,
  },

  previewBox: {
    backgroundColor: "#FFF7FA",
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#F8D4E0",
  },

  previewRow: {
    marginBottom: 10,
  },

  previewLabel: {
    fontSize: 11,
    color: colors.textGray,
    marginBottom: 2,
    fontWeight: "700",
  },

  previewValue: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "900",
  },

  confirmBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 10,
  },

  confirmText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#fff",
  },

  cancelBtn: {
    paddingVertical: 10,
    alignItems: "center",
  },

  cancelText: {
    fontSize: 13,
    color: colors.textGray,
    fontWeight: "600",
  },
});