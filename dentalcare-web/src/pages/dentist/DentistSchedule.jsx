import { useEffect, useMemo, useState } from "react";
import Sidebar from "../../components/dentist/layout/Sidebar";
import Topbar from "../../components/dentist/layout/Topbar";
import profileImage from "../../assets/profile_sample.jpg";

import "../../styles/dentist/layout/sidebar.css";
import "../../styles/dentist/layout/topbar.css";
import "../../styles/dentist/notifications/notification-popup.css";
import "../../styles/dentist/schedule/schedule-page.css";
import "../../styles/dentist/shared/responsive.css";

const START_HOUR = 9;
const END_HOUR = 18;
const SLOT_HEIGHT = 64;

const STATUS_CLASS = {
  completed: "completed",
  waiting: "waiting",
  in_treatment: "in-treatment",
  cancelled: "cancelled",
  confirmed: "confirmed",
};

function formatTimeLabel(hour, minute = 0) {
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${String(minute).padStart(2, "0")} ${suffix}`;
}

function generateTimeSlots(startHour, endHour) {
  const slots = [];
  for (let hour = startHour; hour < endHour; hour++) {
    slots.push({ hour, minute: 0, label: formatTimeLabel(hour, 0) });
    slots.push({ hour, minute: 30, label: formatTimeLabel(hour, 30) });
  }
  return slots;
}

function timeToMinutes(timeStr) {
  const [time, modifier] = timeStr.split(" ");
  let [hours, minutes] = time.split(":").map(Number);

  if (modifier === "PM" && hours !== 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

function formatDateForInput(date) {
  return date.toISOString().split("T")[0];
}

export default function DentistSchedule() {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedDate, setSelectedDate] = useState(formatDateForInput(new Date()));
  const [branches, setBranches] = useState([]);
  const [appointments, setAppointments] = useState([]);

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "New Appointment Requests:",
      message: "John Doe for Consultation",
      time: "2 mins ago",
    },
    {
      id: 2,
      title: "Pre-Assessment Completed:",
      message: "Jane Smith for Tooth Extraction",
      time: "10 mins ago",
    },
    {
      id: 3,
      title: "Pre-Assessment Completed:",
      message: "Jane Smith for Tooth Extraction",
      time: "10 mins ago",
    },
    {
      id: 4,
      title: "Pre-Assessment Completed:",
      message: "Jane Smith for Tooth Extraction",
      time: "10 mins ago",
    },
    {
      id: 5,
      title: "Pre-Assessment Completed:",
      message: "Jane Smith for Tooth Extraction",
      time: "10 mins ago",
    },
    {
      id: 6,
      title: "New Appointment Requests:",
      message: "John Doe for Consultation",
      time: "2 mins ago",
    },
  ]);

  useEffect(() => {
    const branchData = [
      { id: 1, name: "General Trias Cavite" },
      { id: 2, name: "Dasmariñas Cavite" },
    ];

    setBranches(branchData);
    setSelectedBranch(branchData[0].name);
  }, []);

  useEffect(() => {
    if (!selectedBranch || !selectedDate) return;

    const sampleData = [
      {
        id: 1,
        patientName: "Sarah Kim",
        startTime: "9:00 AM",
        endTime: "10:00 AM",
        status: "completed",
        service: "Consultation",
        branch: "General Trias Cavite",
        date: selectedDate,
        dentistId: 1,
      },
      {
        id: 2,
        patientName: "Sarah Kim",
        startTime: "12:00 PM",
        endTime: "1:00 PM",
        status: "completed",
        service: "Cleaning",
        branch: "General Trias Cavite",
        date: selectedDate,
        dentistId: 1,
      },
      {
        id: 3,
        patientName: "Sarah Kim",
        startTime: "2:00 PM",
        endTime: "3:00 PM",
        status: "in_treatment",
        service: "Braces Adjustment",
        branch: "General Trias Cavite",
        date: selectedDate,
        dentistId: 1,
      },
      {
        id: 4,
        patientName: "Sarah Kim",
        startTime: "3:30 PM",
        endTime: "5:00 PM",
        status: "waiting",
        service: "Follow-up Checkup",
        branch: "General Trias Cavite",
        date: selectedDate,
        dentistId: 1,
      },
    ];

    const filtered = sampleData.filter(
      (item) =>
        item.branch === selectedBranch &&
        item.date === selectedDate 
    );

    setAppointments(filtered);
  }, [selectedBranch, selectedDate]);

  const handleToggleNotifications = () => {
    setIsNotificationOpen((prev) => !prev);
  };

  const handleCloseNotifications = () => {
    setIsNotificationOpen(false);
  };

  const handleMarkAllRead = () => {
    setNotifications([]);
    setIsNotificationOpen(false);
  };

  const timeSlots = useMemo(() => generateTimeSlots(START_HOUR, END_HOUR), []);

  const positionedAppointments = useMemo(() => {
    const scheduleStartMinutes = START_HOUR * 60;

    return appointments.map((appointment) => {
      const start = timeToMinutes(appointment.startTime);
      const end = timeToMinutes(appointment.endTime);

      const top = ((start - scheduleStartMinutes) / 30) * SLOT_HEIGHT;
      const height = ((end - start) / 30) * SLOT_HEIGHT;

      return {
        ...appointment,
        top,
        height,
      };
    });
  }, [appointments]);

  return (
    <div className="dentist-dashboard">
      <Sidebar />

      <main className="main-content">
        <Topbar
          title="Manage Schedule"
          notifications={notifications}
          isNotificationOpen={isNotificationOpen}
          onToggleNotifications={handleToggleNotifications}
          onCloseNotifications={handleCloseNotifications}
          onMarkAllRead={handleMarkAllRead}
          profileImage={profileImage}
        />

        <section className="schedule-page">
          <div className="schedule-filters">
            <div className="filter-group">
              <label>Select Branch</label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
              >
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.name}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
          </div>

          <div className="schedule-board">
            <div className="schedule-scroll-area">
                <div className="schedule-grid-wrapper">
                <div className="time-column">
                    {timeSlots.map((slot, index) => (
                    <div key={index} className="time-slot-label">
                        {slot.label}
                    </div>
                    ))}
                </div>

                <div className="schedule-grid">
                    {timeSlots.map((_, index) => (
                    <div key={index} className="schedule-row" />
                    ))}

                    {positionedAppointments.map((appointment) => (
                    <div
                        key={appointment.id}
                        className={`appointment-card ${
                        STATUS_CLASS[appointment.status] || "confirmed"
                        }`}
                        style={{
                        top: `${appointment.top}px`,
                        height: `${appointment.height - 6}px`,
                        }}
                    >
                        <div className="appointment-status">
                        {appointment.status.replace("_", " ")}
                        </div>
                        <div className="appointment-patient">
                        {appointment.patientName}
                        </div>
                        <div className="appointment-time">
                        {appointment.startTime} to {appointment.endTime}
                        </div>
                    </div>
                    ))}

                    {appointments.length === 0 && (
                    <div className="schedule-empty">
                        No appointments for this date and branch.
                    </div>
                    )}
                </div>
                </div>
            </div>
            </div>
        </section>
      </main>
    </div>
  );
}