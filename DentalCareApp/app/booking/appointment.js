import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, Alert, Platform, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { colors } from "../theme/colors";
import DateTimePicker from "@react-native-community/datetimepicker";
import PinkAlert from "../components/PinkAlert";
import { supabase } from "../../server/supabaseService";
import { getCurrentUser } from "../../server/supabaseService";
import { getCurrentActiveProfileForSession, getPatientProfileByProfileId } from "../_storage/authStorage";

/* ---------- helpers ---------- */
function monthShort(d) {
  return d.toLocaleString("en-US", { month: "short" }).toUpperCase(); // JAN
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
function formatMonthDay(d) {
  return `${monthShort(d)} ${pad2(d.getDate())}`; // e.g. JAN 27
}
function buildNext7Days() {
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    d.setHours(0, 0, 0, 0);
    return { iso: toISODate(d), label: formatMonthDay(d) };
  });
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
  const { branch, doctor, preassessmentId, service } = useLocalSearchParams();
  const [showAlert, setShowAlert] = useState(false);
  const [dentistData, setDentistData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [bookedTimeSlots, setBookedTimeSlots] = useState([]);

  // date pills (state so we can add a new one from calendar)
  const [datePills, setDatePills] = useState(() => buildNext7Days());

  // selected date
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [selectedISO, setSelectedISO] = useState(toISODate(today));
  const [selectedLabel, setSelectedLabel] = useState(formatMonthDay(today));

  // time
  const [selectedTime, setSelectedTime] = useState("9:00 AM");
  const [timeTab, setTimeTab] = useState("Morning");

  // calendar picker
  const [showCalendar, setShowCalendar] = useState(false);
  const [pickedDate, setPickedDate] = useState(today);

  const timesMorning = [
    "8:00 AM",
    "8:30 AM",
    "9:00 AM",
    "9:30 AM",
    "10:00 AM",
    "10:30 AM",
    "11:00 AM",
    "11:30 AM",
  ];
  const timesAfternoon = [
    "1:00 PM",
    "1:30 PM",
    "2:00 PM",
    "2:30 PM",
    "3:00 PM",
    "3:30 PM",
    "4:00 PM",
    "4:30 PM",
  ];
  const times = timeTab === "Morning" ? timesMorning : timesAfternoon;

  useEffect(() => {
    fetchDentistData();
  }, [doctor]);

  useEffect(() => {
    if (dentistData && selectedISO) {
      fetchBookedTimeSlots();
    }
  }, [dentistData, selectedISO]);

  const fetchDentistData = async () => {
    if (!doctor) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('dentist_list')
        .select(`
          *,
          dentist_schedule(*)
        `)
        .eq('name', doctor)
        .single();

      if (error) throw error;
      setDentistData(data);
    } catch (err) {
      console.error('Error fetching dentist:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookedTimeSlots = async () => {
    if (!dentistData || !selectedISO) return;

    try {
      console.log('Fetching booked slots for:', {
        dentistId: dentistData.id,
        date: selectedISO,
        branch: branch
      });

      const { data, error } = await supabase
        .from('bookings')
        .select('appointment_time, branch, dentist_id, appointment_date')
        .eq('dentist_id', dentistData.id)
        .eq('appointment_date', selectedISO)
        .eq('branch', branch)
        .in('status', ['pending', 'confirmed']); // Check both pending and confirmed bookings

      if (error) throw error;

      console.log('Found bookings:', data);

      // Convert 24-hour times back to 12-hour format and extract time strings
      const bookedTimes = data.map(booking => {
        const time24h = booking.appointment_time;
        return convertTo12Hour(time24h);
      }).filter(Boolean); // Remove any invalid conversions

      console.log('Booked time slots (12h format):', bookedTimes);
      setBookedTimeSlots(bookedTimes);
    } catch (err) {
      console.error('Error fetching booked time slots:', err);
      setBookedTimeSlots([]);
    }
  };

  const onPickDate = (event, date) => {
    
    if (Platform.OS !== "ios") setShowCalendar(false);

    
    if (event?.type === "dismissed" || !date) return;

    date.setHours(0, 0, 0, 0);
    setPickedDate(date);

    const iso = toISODate(date);
    const label = formatMonthDay(date);

    
    setSelectedISO(iso);
    setSelectedLabel(label);

    
    setDatePills((prev) => {
      const exists = prev.some((p) => p.iso === iso);
      if (exists) return prev;

      const next = [...prev, { iso, label }].sort((a, b) => a.iso.localeCompare(b.iso));
      if (next.length > 7) next.shift(); 
      return next;
    });

    
    if (Platform.OS === "ios") setShowCalendar(false);
  };

  const handleBooking = async () => {
    if (booking) return;
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
      const profileId = activeProfile?.id || null;

      const time24h = convertTo24Hour(selectedTime);

      console.log('Creating booking:', {
        dentistId: dentistData.id,
        date: selectedISO,
        time12h: selectedTime,
        time24h: time24h,
        branch: branch,
        profileId,
      });

      // Check for existing booking at same slot
      const { data: existingBooking } = await supabase
        .from('bookings')
        .select('id, patient_name')
        .eq('dentist_id', dentistData.id)
        .eq('appointment_date', selectedISO)
        .eq('appointment_time', time24h)
        .eq('branch', branch)
        .in('status', ['pending', 'confirmed']);

      if (existingBooking && existingBooking.length > 0) {
        Alert.alert('Time Slot Unavailable', 'This time slot is already booked by another patient. Please select a different time.');
        setBooking(false);
        await fetchBookedTimeSlots();
        return;
      }

      // Check if this profile already has a booking with this doctor on this date
      let dupQuery = supabase
        .from('bookings')
        .select('id')
        .eq('dentist_id', dentistData.id)
        .eq('appointment_date', selectedISO)
        .eq('status', 'pending');

      dupQuery = profileId
        ? dupQuery.eq('profile_id', profileId)
        : dupQuery.eq('user_id', user.id);

      const { data: userExistingBooking } = await dupQuery;
      if (userExistingBooking && userExistingBooking.length > 0) {
        Alert.alert('Booking Exists', 'You already have a booking with this doctor on this date.');
        setBooking(false);
        return;
      }

      // Use preassessmentId passed from the pre-assessment flow
      if (!preassessmentId) {
        Alert.alert('Preassessment Required', 'Please complete the pre-assessment first before booking.');
        setBooking(false);
        return;
      }

      const bookingData = {
        user_id: user.id,
        profile_id: profileId,
        patient_name: patientName,
        service: service || null,
        dentist_id: dentistData.id,
        branch: branch,
        appointment_date: selectedISO,
        appointment_time: time24h,
        preassessment_id: preassessmentId,
        status: 'pending'
      };

      console.log('Inserting booking data:', bookingData);

      const { error } = await supabase
        .from('bookings')
        .insert([bookingData]);

      if (error) throw error;

      console.log('Booking created successfully');
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

  return (
    <View style={styles.container}>
     
      <View style={styles.headerRow}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={colors.primary} />
        </Pressable>

        <View style={styles.headerRight}>
          <Ionicons name="heart-outline" size={18} color={colors.primary} />
          <Ionicons name="share-social-outline" size={18} color={colors.primary} />
        </View>
      </View>

      {/* Doctor header */}
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

      {/* Stats */}
      <View style={styles.statsRow}>
        <Stat label="Experience" value={`${dentistData?.experience_years || 14} years`} />
        <Stat label="Patients" value={dentistData?.total_patients || "1234"} />
        <Stat label="Success Rate" value={`${dentistData?.success_rate || 99.9}%`} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        <Text style={[styles.tab, styles.tabActive]}>Schedules</Text>
        <Text style={styles.tab}>About</Text>
        <Text style={styles.tab}>Experiences</Text>
        <Text style={styles.tab}>Specialization</Text>
      </View>
      <View style={styles.tabLine} />

      <ScrollView contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        {/* Date */}
        <Text style={styles.section}>Date</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
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
                <Text style={[styles.dateText, active && { color: "#fff" }]}>{d.label}</Text>
              </Pressable>
            );
          })}

          {/* Calendar pill as LAST */}
          <Pressable style={[styles.datePill, styles.calendarPill]} onPress={() => setShowCalendar(true)}>
            <Ionicons name="calendar-outline" size={18} color={colors.primary} />
          </Pressable>
        </ScrollView>

        {/* DateTimePicker */}
        {showCalendar && (
          <DateTimePicker
            value={pickedDate}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "calendar"}
            onChange={onPickDate}
            accentColor={colors.primary} 
          />
        )}

        {/* Time */}
        <Text style={[styles.section, { marginTop: 18 }]}>Time</Text>

        <View style={styles.timeTabs}>
          <Pressable
            style={[styles.timeTab, timeTab === "Morning" && styles.timeTabActive]}
            onPress={() => setTimeTab("Morning")}
          >
            <Text style={[styles.timeTabText, timeTab === "Morning" && { color: "#fff" }]}>Morning</Text>
          </Pressable>

          <Pressable
            style={[styles.timeTab, timeTab === "Afternoon" && styles.timeTabActive]}
            onPress={() => setTimeTab("Afternoon")}
          >
            <Text style={[styles.timeTabText, timeTab === "Afternoon" && { color: "#fff" }]}>Afternoon</Text>
          </Pressable>
        </View>

        <View style={styles.timeGrid}>
          {times.map((t) => {
            const active = t === selectedTime;
            const isBooked = bookedTimeSlots.includes(t);
            
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

        {bookedTimeSlots.length > 0 && (
          <Text style={styles.bookedInfo}>
            * Grayed out times are already booked for this doctor and branch
          </Text>
        )}
      </ScrollView>

      {/* Book Now */}
      <Pressable 
        style={[styles.bookBtn, booking && { opacity: 0.5 }]} 
        onPress={handleBooking}
        disabled={booking}
      >
        <Text style={styles.bookText}>
          {booking ? "Booking..." : "Book Now"}
        </Text>
      </Pressable>

      
      <PinkAlert
        visible={showAlert}
        title="Booked!"
        message={`You have booked an appointment on ${selectedLabel} at ${selectedTime}.`}
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
      <Text style={{ fontSize: 12, fontWeight: "900", color: "#666" }}>{value}</Text>
      <Text style={{ fontSize: 9, color: colors.textGray }}>{label}</Text>
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingTop: 46, paddingHorizontal: 18 },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  headerRight: { flexDirection: "row", gap: 14, alignItems: "center" },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },

  doctorRow: { marginTop: 10, marginLeft: 23, flexDirection: "row", alignItems: "center", gap: 12 },
  docPic: { width: 77, height: 83, borderRadius: 12, backgroundColor: "#eee", alignItems: "center", justifyContent: "center" },
  docName: { fontSize: 17, fontWeight: "900", color: colors.primary },
  docSub: { marginTop: 2, fontSize: 12, color: colors.textGray },

  statsRow: { marginTop: 14, flexDirection: "row", justifyContent: "space-around" },

  tabsRow: { marginTop: 30, flexDirection: "row", justifyContent: "space-between" },
  tab: { fontSize: 11, color: colors.textGray },
  tabActive: { color: colors.primary, fontWeight: "900" },
  tabLine: { marginTop: 8, height: 1, backgroundColor: "#eee" },

  section: { marginTop: 16, marginBottom: 12, fontSize: 14, fontWeight: "900", color: colors.primary },

  
  datePill: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#EDEDED",
    alignItems: "center",
    justifyContent: "center",
  },
  datePillActive: { backgroundColor: colors.primary },
  dateText: { fontSize: 10, fontWeight: "900", color: "#777" },

  calendarPill: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.primary,
  },

  timeTabs: { marginTop: 10, height: 34, borderRadius: 18, backgroundColor: "#EDEDED", flexDirection: "row", overflow: "hidden" },
  timeTab: { flex: 1, alignItems: "center", justifyContent: "center" },
  timeTabActive: { backgroundColor: colors.primary },
  timeTabText: { fontSize: 10, fontWeight: "900", color: "#777" },

  timeGrid: { marginTop: 16, flexDirection: "row", flexWrap: "wrap", gap: 12 },
  timeBox: { width: "47%", height: 44, borderRadius: 10, backgroundColor: "#EDEDED", alignItems: "center", justifyContent: "center" },
  timeBoxActive: { backgroundColor: colors.primary },
  timeBoxBooked: { 
    backgroundColor: "#F5F5F5", 
    borderWidth: 1, 
    borderColor: "#E0E0E0",
    opacity: 0.6
  },
  timeText: { fontSize: 10, fontWeight: "900", color: "#777" },
  timeTextBooked: { 
    color: "#999", 
    fontSize: 9
  },
  bookedLabel: {
    fontSize: 7,
    color: "#999",
    marginTop: 1
  },
  bookedInfo: {
    marginTop: 12,
    fontSize: 10,
    color: colors.textGray,
    textAlign: "center",
    fontStyle: "italic"
  },

  bookBtn: {
    position: "absolute",
    bottom: 50,
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
  bookText: { color: "#fff", fontSize: 12, fontWeight: "900" },
});
