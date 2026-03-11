import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "./theme/colors";
import { getSession } from "./storage/authStorage";
import { useRouter } from "expo-router";
import { logoutUser } from "./storage/authStorage";
import ProfileSwitcherModal from "./components/ProfileSwitcherModal";


export default function Home() {
    const router = useRouter();

  const [fullName, setFullName] = useState("User");

  useEffect(() => {
    (async () => {
      const session = await getSession();
      if (session?.fullName) setFullName(session.fullName);
    })();
  }, []);

  const [profileModalVisible, setProfileModalVisible] = useState(false);

  const [selectedProfile, setSelectedProfile] = useState({
    id: "1",
    name: "Dian",
    icon: "person",
  });

  const profiles = [
    { id: "1", name: "Dian", icon: "person" },
    { id: "2", name: "Mom", icon: "person" },
    { id: "3", name: "Guest", icon: "person" },
  ];

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll}>
        
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.hello}>Hello,</Text>
            <Text style={styles.name}>{fullName}</Text>
          </View>

          <View style={styles.headerRight}>
            <Pressable
                style={styles.iconCircle}
                onPress={() => router.push("/notification")}
              >
                <Ionicons
                  name="notifications-outline"
                  size={18}
                  color={colors.primary}
                />
              </Pressable>

            <Pressable
                style={styles.avatarCircle}
                onPress={() => setProfileModalVisible(true)}
                >
                <Ionicons name="person" size={18} color={colors.primary} />
            </Pressable>

            <ProfileSwitcherModal
              visible={profileModalVisible}
              onClose={() => setProfileModalVisible(false)}
              profiles={profiles}
              selectedProfile={selectedProfile}
              onSelectProfile={(profile) => setSelectedProfile(profile)}
            />

          </View>
        </View>

        
        <View style={styles.searchWrap}>
          <TextInput
            placeholder="Search"
            placeholderTextColor={colors.textGray}
            style={styles.searchInput}
          />
          <Ionicons name="search" size={16} color={colors.primary} />
        </View>

        
        <View style={styles.quickRow}>
          <QuickBtn
            icon={<Ionicons name="medical-outline" size={22} color={colors.primary} />}
            label="Dentist"
            onPress={() => router.push("/dentists")}
          />

          <QuickBtn
            icon={<Ionicons name="location-outline" size={18} color={colors.primary} />}
            label="Branches"
            onPress={() => router.push("/branches")}
          />

          <QuickBtn icon={<MaterialCommunityIcons name="tooth-outline" size={18} color={colors.primary} />} 
          label="3D Model" 
          onPress={() => router.push("/tooth-3d")}
          />

          <QuickBtn
            icon={<Ionicons name="calendar-outline" size={20} color={colors.primary} />}
            label="Appointments"
             onPress={() => router.push("/appointments")}
          />

          <QuickBtn icon={<Ionicons name="medkit-outline" size={18} color={colors.primary} />} 
          label="Services" 
          onPress={() => router.push("/services")}
          />
        </View>

                {/* Queue Card */}
        <View style={styles.queueCard}>
          <View style={styles.queueTopRow}>
            <Text style={styles.queueTitle}>Current Queue</Text>

            <Pressable style={styles.refreshBtn} onPress={() => { /* refresh logic here */ }}>
              <Ionicons name="refresh" size={12} color={colors.white} />
              <Text style={styles.refreshText}>Refresh Now</Text>
            </Pressable>
          </View>

          <Text style={styles.queueNumber}>#27</Text>
          <Text style={styles.queueSub}>Your position in queue</Text>

          <View style={styles.queueProgressTrack}>
            <View style={styles.queueProgressFill} />
          </View>

          <Text style={styles.queueWait}>Estimated wait: 1 hour and 25 minutes</Text>
        </View>

        
        <Text style={styles.sectionTitle}>Upcoming Appointment</Text>
        <View style={styles.upcomingCard}>
          <View style={styles.upTopRow}>
            <View style={styles.docAvatar}>
              <Ionicons name="person" size={18} color={colors.primary} />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.docName}>Dr. Dian Crizzie Mendoza</Text>
              <Text style={styles.docSub}>GC Dental Care - Dentist</Text>
            </View>
          </View>

          <View style={styles.dateRow}>
            <View style={styles.dateChip}>
              <Ionicons name="calendar-outline" size={14} color={colors.white} />
              <Text style={styles.dateText}>Tues, 13 Jan 2026</Text>
            </View>
            <View style={styles.dateChip}>
              <Ionicons name="time-outline" size={14} color={colors.white} />
              <Text style={styles.dateText}>10:30 AM - 12:00 PM</Text>
            </View>
          </View>
        </View>

      
        <View style={styles.rowBetween}>
          <Text style={styles.sectionTitle}>My Recent Visit</Text>
          <Pressable>
            <Text style={styles.seeAll}>See all</Text>
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
          <RecentCard
            title="Dr. Mendoza"
            clinic="GC Dental Care - Dentist"
            service="SERVICE: Teeth Cleaning"
          />
          <RecentCard
            title="Dr. Guillermo"
            clinic="GC Dental Care - Dentist"
            service="SERVICE: Dental Implant"
          />
          <RecentCard
            title="Dr. Amparo"
            clinic="GC Dental Care - Dentist"
            service="SERVICE: Braces"
          />
        </ScrollView>

       
        <Text style={[styles.sectionTitle, { marginTop: 18 }]}>Treatment Plan</Text>

        <TreatmentItem
          title="Teeth Whitening"
          sub="Scheduled for January 20, 2026 - 10:00 AM"
          status="STATUS: Confirmed"
          rightA="VIEW DETAILS"
          rightB="RESCHEDULE"
        />
        <TreatmentItem
          title="Routine Cleaning"
          sub="Due in 3 Months - April 2026"
          status="STATUS: Suggested Booking"
          rightA="VIEW DETAILS"
          rightB="BOOK NOW"
        />
        <TreatmentItem
          title="Routine Cleaning"
          sub="Due in 8 Months - July 2026"
          status="STATUS: Suggested Booking"
          rightA="VIEW DETAILS"
          rightB="BOOK NOW"
        />

        <View style={{ height: 90 }} />
      </ScrollView>

 
      <View style={styles.bottomBar}>
        <View style={styles.slot}>
            <NavItem icon="home-outline" label="Home" active />
        </View>

        <View style={styles.slot}>
            <NavItem
                icon="document-text-outline"
                label="Pre-Assessment"
                onPress={() => router.push("/pre-assessment")}
            />
        </View>


        <View style={styles.centerSlot} />

        <View style={styles.slot}>
          <NavItem
            icon="heart-outline"
            label="History"
            onPress={() => router.push("/history")}
          />
        </View>

        <View style={styles.slot}>
            <NavItem
              icon="person-outline"
              label="Profile"
              onPress={() => router.push("/profile")}
            />

        </View>
      </View>




   
      <Pressable style={styles.fab}>
        <Ionicons name="add" size={26} color={colors.white} />
      </Pressable>
    </View>
  );
}


function QuickBtn({ icon, label, onPress }) {
  return (
    <Pressable style={styles.quickBtn} onPress={onPress}>
      <View style={styles.quickIcon}>{icon}</View>
      <Text style={styles.quickLabel}>{label}</Text>
    </Pressable>
  );
}

function RecentCard({ title, clinic, service }) {
  return (
    <View style={styles.recentCard}>
      <View style={styles.recentTop}>
        <View style={styles.recentAvatar}>
          <Ionicons name="person" size={18} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.recentTitle}>{title}</Text>
          <Text style={styles.recentClinic}>{clinic}</Text>
        </View>
      </View>

      <Text style={styles.recentService}>{service}</Text>

      <View style={styles.recentBtnRow}>
        <Pressable style={styles.grayBtn}>
          <Text style={styles.grayBtnText}>BOOK NOW</Text>
        </Pressable>
        <Pressable style={styles.grayBtn}>
          <Text style={styles.grayBtnText}>DETAILS</Text>
        </Pressable>
      </View>
    </View>
  );
}

function TreatmentItem({ title, sub, status, rightA, rightB }) {
  return (
    <View style={styles.treatCard}>
      <Text style={styles.treatTitle}>{title}</Text>
      <Text style={styles.treatSub}>{sub}</Text>
      <Text style={styles.treatStatus}>{status}</Text>

      <View style={styles.treatActions}>
        <Pressable style={styles.smallChip}>
          <Text style={styles.smallChipText}>{rightA}</Text>
        </Pressable>
        <Pressable style={[styles.smallChip, { backgroundColor: colors.primary }]}>
          <Text style={[styles.smallChipText, { color: colors.white }]}>{rightB}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function NavItem({ icon, label, active, onPress }) {
  return (
    <Pressable style={styles.navItem} onPress={onPress}>
      <Ionicons name={icon} size={20} color={active ? colors.primary : colors.textGray} />
      <Text style={[styles.navLabel, { color: active ? colors.primary : colors.textGray }]}>{label}</Text>
    </Pressable>
  );
}


const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  scroll: { paddingHorizontal: 18, paddingTop: 46 },

  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  hello: { fontSize: 16, fontWeight: "800", color: colors.primary },
  name: { fontSize: 18, fontWeight: "900", color: colors.textGray },

  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconCircle: {
    width: 34, 
    height: 34, 
    borderRadius: 17, 
    backgroundColor: "#FFE9F1",
    alignItems: "center", 
    justifyContent: "center",
  },
  avatarCircle: {
    width: 34, 
    height: 34, 
    borderRadius: 17, 
    backgroundColor: "#FFE9F1",
    alignItems: "center", 
    justifyContent: "center",
  },

  searchWrap: {
    marginTop: 14, 
    height: 40, 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: colors.primary,
    paddingHorizontal: 14, 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between",
  },
  searchInput: { flex: 1, fontSize: 12, color: colors.textDark, paddingRight: 10 },

  quickRow: { marginTop: 14, flexDirection: "row", justifyContent: "space-between" },
  quickBtn: { width: "18%", alignItems: "center" },
  quickIcon: {
    width: 46, 
    height: 46, 
    borderRadius: 12, 
    backgroundColor: "#FFE9F1",
    alignItems: "center", 
    justifyContent: "center",
    shadowColor: "#000", 
    shadowOpacity: 0.12, 
    shadowRadius: 6, 
    elevation: 3,
  },
  quickLabel: { marginTop: 6, fontSize: 9, color: colors.textGray, textAlign: "center" },

  sectionTitle: { marginTop: 16, fontSize: 13, fontWeight: "800", color: "#777" },

  queueCard: {
  marginTop: 14,
  borderRadius: 18,
  backgroundColor: colors.primary, // pink card
  padding: 14,
  shadowColor: "#000",
  shadowOpacity: 0.18,
  shadowRadius: 10,
  elevation: 4,
},

queueTopRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
},

queueTitle: {
  fontSize: 12,
  fontWeight: "800",
  color: colors.white,
},

refreshBtn: {
  flexDirection: "row",
  alignItems: "center",
  gap: 6,
  paddingHorizontal: 10,
  paddingVertical: 6,
  borderRadius: 12,
  backgroundColor: "rgba(255,255,255,0.2)",
},

refreshText: {
  fontSize: 9,
  fontWeight: "800",
  color: colors.white,
},

queueNumber: {
  marginTop: 10,
  fontSize: 40,
  fontWeight: "900",
  color: colors.white,
  textAlign: "center",
},

queueSub: {
  marginTop: 2,
  fontSize: 10,
  color: "rgba(255,255,255,0.85)",
  textAlign: "center",
  fontWeight: "700",
},

queueProgressTrack: {
  marginTop: 12,
  height: 6,
  borderRadius: 99,
  backgroundColor: "rgba(255,255,255,0.35)",
  overflow: "hidden",
},

queueProgressFill: {
  width: "80%", // change this to control the filled progress
  height: "100%",
  borderRadius: 99,
  backgroundColor: colors.white,
},

queueWait: {
  marginTop: 10,
  fontSize: 10,
  color: colors.white,
  textAlign: "center",
  fontWeight: "800",
},

  upcomingCard: { marginTop: 10, borderRadius: 18, backgroundColor: "#FFD6E6", padding: 14 },
  upTopRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  docAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  docName: { fontSize: 12, fontWeight: "900", color: colors.primary },
  docSub: { marginTop: 2, fontSize: 10, color: "#888" },

  dateRow: { marginTop: 10, flexDirection: "row", justifyContent: "space-between", gap: 10 },
  dateChip: {
    flex: 1, 
    height: 30, 
    borderRadius: 10, 
    backgroundColor: "#6E6E6E",
    alignItems: "center", 
    justifyContent: "center", 
    flexDirection: "row", gap: 6,
  },
  dateText: { fontSize: 9, color: colors.white, fontWeight: "700" },

  rowBetween: { marginTop: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  seeAll: { fontSize: 10, color: colors.textGray, marginTop: 18 },

  recentCard: {
    marginTop: 10, width: 170, borderRadius: 16, backgroundColor: "#8B8B8B",
    padding: 12, shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 10, elevation: 4,
  },
  recentTop: { flexDirection: "row", gap: 10, alignItems: "center" },
  recentAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  recentTitle: { fontSize: 11, fontWeight: "900", color: colors.primary },
  recentClinic: { marginTop: 2, fontSize: 9, color: "#EDEDED" },
  recentService: { marginTop: 10, fontSize: 9, color: "#EDEDED" },

  recentBtnRow: { marginTop: 10, flexDirection: "row", justifyContent: "space-between", gap: 10 },
  grayBtn: { flex: 1, height: 28, borderRadius: 10, backgroundColor: "#6B6B6B", alignItems: "center", justifyContent: "center" },
  grayBtnText: { fontSize: 9, color: "#fff", fontWeight: "800" },

  treatCard: { marginTop: 10, borderRadius: 16, backgroundColor: "#BFBFBF", padding: 14 },
  treatTitle: { fontSize: 12, fontWeight: "900", color: colors.primary },
  treatSub: { marginTop: 2, fontSize: 9, color: "#5F5F5F" },
  treatStatus: { marginTop: 4, fontSize: 9, color: "#5F5F5F", fontWeight: "700" },

  treatActions: { marginTop: 10, flexDirection: "row", justifyContent: "flex-end", gap: 8 },
  smallChip: { height: 22, paddingHorizontal: 10, borderRadius: 10, backgroundColor: "#E7E7E7", alignItems: "center", justifyContent: "center" },
  smallChipText: { fontSize: 8, color: "#666", fontWeight: "800" },

  bottomBar: {
  position: "absolute",
  left: 0,
  right: 0,
  bottom: 0,
  height: 60,
  backgroundColor: "#FFE9F1",
  borderTopLeftRadius: 18,
  borderTopRightRadius: 18,
  flexDirection: "row",
  alignItems: "center",
  paddingHorizontal: 15,          
},

slot: {
  width: "20%",                 
  alignItems: "center",
  justifyContent: "center",
},

centerSlot: {
  width: "20%",                  
},

navItem: {
  alignItems: "center",
  justifyContent: "center",
},

  navItem: { alignItems: "center", justifyContent: "center" },
  navLabel: { marginTop: 3, fontSize: 9, fontWeight: "700" },

  fab: {
    position: "absolute",
    bottom: 38,
    alignSelf: "center",
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
});
