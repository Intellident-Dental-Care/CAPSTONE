import { useEffect, useMemo, useState } from "react";
import Sidebar from "../../components/dentist/layout/Sidebar";
import Topbar from "../../components/dentist/layout/Topbar";
import profileImage from "../../assets/profile_sample.jpg";
import { getDentistSchedule } from "../../services/dentistService";

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
  for (let hour = startHour; hour < endHour; hour += 1) {
    slots.push({ hour, minute: 0, label: formatTimeLabel(hour, 0) });
    slots.push({ hour, minute: 30, label: formatTimeLabel(hour, 30) });
  }
  return slots;
}

function timeToMinutes(timeStr) {
  const [time, modifier] = String(timeStr || "").split(" ");
  const [hoursText, minutesText] = String(time || "0:0").split(":");
  let hours = Number(hoursText);
  const minutes = Number(minutesText);

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
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    let mounted = true;

    const loadSchedule = async () => {
      const result = await getDentistSchedule({
        date: selectedDate,
        branch: selectedBranch || undefined,
        forceRefresh: true,
      });

      if (!mounted || !result?.success) return;

      const payload = result.data || {};
      const nextBranches = payload.branches || [];
      setBranches(nextBranches);

      if (!selectedBranch && nextBranches.length) {
        setSelectedBranch(nextBranches[0]);
      }

      setAppointments(payload.appointments || []);
      setNotifications(payload.notifications || []);
    };

    loadSchedule();

    return () => {
      mounted = false;
    };
  }, [selectedDate, selectedBranch]);

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
                  <option key={branch} value={branch}>
                    {branch}
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
                      className={`appointment-card ${STATUS_CLASS[appointment.status] || "confirmed"}`}
                      style={{
                        top: `${appointment.top}px`,
                        height: `${appointment.height - 6}px`,
                      }}
                    >
                      <div className="appointment-status">{appointment.status.replace("_", " ")}</div>
                      <div className="appointment-patient">{appointment.patientName}</div>
                      <div className="appointment-time">
                        {appointment.startTime} to {appointment.endTime}
                      </div>
                    </div>
                  ))}

                  {appointments.length === 0 && (
                    <div className="schedule-empty">No appointments for this date and branch.</div>
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
