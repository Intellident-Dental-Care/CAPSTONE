import { useEffect, useMemo, useState } from "react";
import logo from "../../assets/logo.png";
import SuperAdminSidebar from "../../components/superadmin/layout/SuperAdminSidebar";
import SuperAdminTopbar from "../../components/superadmin/layout/SuperAdminTopbar";
import {
  getSuperAdminDentists,
  createSuperAdminDentist,
  updateSuperAdminDentistStatus,
  updateSuperAdminDentistSchedules,
} from "../../services/superAdminService";

import "../../styles/admin/layout/admin-sidebar.css";
import "../../styles/admin/layout/admin-topbar.css";
import "../../styles/admin/notifications/admin-notification-popup.css";
import "../../styles/admin/shared/admin-responsive.css";

import "../../styles/superadmin/dentists/superadmin-dentists.css";
import "../../styles/superadmin/shared/superadmin-responsive.css";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const BRANCHES = [
  "All Branches",
  "Dasmarinas, Cavite",
  "General Trias, Cavite",
  "Bacoor, Cavite",
];

const REGISTER_BRANCHES = [
  "Dasmarinas, Cavite",
  "General Trias, Cavite",
  "Bacoor, Cavite",
];

const TIME_SLOT_OPTIONS = [
  "08:00 AM",
  "08:30 AM",
  "09:00 AM",
  "09:30 AM",
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "11:30 AM",
  "12:00 PM",
  "12:30 PM",
  "01:00 PM",
  "01:30 PM",
  "02:00 PM",
  "02:30 PM",
  "03:00 PM",
  "03:30 PM",
  "04:00 PM",
  "04:30 PM",
  "05:00 PM",
  "05:30 PM",
  "06:00 PM",
  "06:30 PM",
  "07:00 PM",
];

const normalizeDay = (dayStr) => {
  const lowered = String(dayStr).toLowerCase();
  if (lowered.includes("mon")) return "Monday";
  if (lowered.includes("tue")) return "Tuesday";
  if (lowered.includes("wed")) return "Wednesday";
  if (lowered.includes("thu")) return "Thursday";
  if (lowered.includes("fri")) return "Friday";
  if (lowered.includes("sat")) return "Saturday";
  if (lowered.includes("sun")) return "Sunday";
  return dayStr;
};

const normalizeBranchStr = (branchStr) => {
  const b = String(branchStr).toLowerCase();
  if (b.includes("dasma")) return "Dasmarinas, Cavite";
  if (b.includes("gentri") || b.includes("trias")) return "General Trias, Cavite";
  if (b.includes("bacoor")) return "Bacoor, Cavite";
  return branchStr;
};

const convertTimeToMinutes = (timeStr) => {
  const [timePart, meridiem] = timeStr.split(" ");
  let [hours, minutes] = timePart.split(":").map(Number);

  if (meridiem === "PM" && hours !== 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;

  return hours * 60 + minutes;
};

const buildTimeRange = (startTime, endTime) => `${startTime} - ${endTime}`;

const DEFAULT_EDIT_TIME_RANGE = buildTimeRange(
  TIME_SLOT_OPTIONS[0],
  TIME_SLOT_OPTIONS[8]
);

const generateTimeRanges = () => {
  const ranges = [];
  for (let i = 0; i < TIME_SLOT_OPTIONS.length; i += 1) {
    for (let j = i + 1; j < TIME_SLOT_OPTIONS.length; j += 1) {
      ranges.push(buildTimeRange(TIME_SLOT_OPTIONS[i], TIME_SLOT_OPTIONS[j]));
    }
  }
  return ranges;
};

const TIME_RANGE_OPTIONS = generateTimeRanges();

const isSameSchedule = (left, right) => {
  return (
    normalizeBranchStr(left.branch) === normalizeBranchStr(right.branch) &&
    normalizeDay(left.day) === normalizeDay(right.day) &&
    String(left.time || "").trim() === String(right.time || "").trim()
  );
};

const normalizeTimeValue = (value) => {
  if (!value) return "";

  const cleaned = String(value).trim().toUpperCase();
  const match = cleaned.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);

  if (!match) return cleaned;

  let [, hour, minute, meridiem] = match;
  hour = hour.padStart(2, "0");

  return `${hour}:${minute} ${meridiem}`;
};

const splitTimeRange = (timeRange) => {
  const raw = String(timeRange || "").replace(/\s+/g, " ").trim();
  const parts = raw.split("-");

  const start = normalizeTimeValue(parts[0]);
  const end = normalizeTimeValue(parts[1]);

  return {
    startTime: start || "08:00 AM",
    endTime: end || "12:00 PM",
  };
};

function buildEmptyScheduleForm() {
  return {
    branch: REGISTER_BRANCHES[0],
    days: [],
    startTime: "08:00 AM",
    endTime: "12:00 PM",
  };
}

function buildEmptyEditScheduleForm() {
  return {
    branch: REGISTER_BRANCHES[0],
    days: [],
    startTime: "08:00 AM",
    endTime: "12:00 PM",
  };
}

function ModalHeader({ title, subtitle, onClose }) {
  return (
    <div className="superadmin-dentists-modal-topbar">
      <div className="superadmin-dentists-modal-topbar-text">
        <h3>{title}</h3>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>

      <button
        type="button"
        className="superadmin-dentists-modal-top-close"
        onClick={onClose}
        aria-label="Close modal"
      >
        ✕
      </button>
    </div>
  );
}

export default function SuperAdminDentists() {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "Dentist Update",
      message: "A dentist schedule was updated.",
      time: "8 mins ago",
    },
  ]);

  const [dentists, setDentists] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [branchFilter, setBranchFilter] = useState("All Branches");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isListModalOpen, setIsListModalOpen] = useState(false);

  const [editingScheduleIndex, setEditingScheduleIndex] = useState(null);
  const [isEditingExistingSchedule, setIsEditingExistingSchedule] = useState(false);


  const [form, setForm] = useState({
    email: "",
  });

  const [scheduleForm, setScheduleForm] = useState(buildEmptyScheduleForm());
  const [pendingSchedules, setPendingSchedules] = useState([]);

  const [confirmModal, setConfirmModal] = useState({
    open: false,
    type: "",
    ids: [],
    title: "",
    message: "",
    payload: null,
  });

  const [viewScheduleModal, setViewScheduleModal] = useState({
    open: false,
    dentistId: null,
    dentistEmail: "",
    dentistName: "",
    schedules: [],
    isEditMode: false,
    scheduleForm: buildEmptyEditScheduleForm(),
  });

  const fetchDentists = async () => {
    const res = await getSuperAdminDentists();
    if (res?.success) {
      setDentists(res.data || []);
    }
  };

  useEffect(() => {
    fetchDentists();
  }, []);

  const resetViewScheduleEditor = () => {
    setEditingScheduleIndex(null);
    setIsEditingExistingSchedule(false);

    setViewScheduleModal((prev) => ({
      ...prev,
      scheduleForm: buildEmptyEditScheduleForm(),
    }));
  };

  const viewScheduleCalendarMap = useMemo(() => {
  const map = {};

  REGISTER_BRANCHES.forEach((branch) => {
    map[branch] = {};
    DAYS.forEach((day) => {
      map[branch][day] = [];
    });
  });

  (viewScheduleModal.schedules || []).forEach((schedule, index) => {
    const branch = normalizeBranchStr(schedule.branch);
    const day = normalizeDay(schedule.day);

    if (!map[branch]) {
      map[branch] = {};
      DAYS.forEach((dayItem) => {
        map[branch][dayItem] = [];
      });
    }

    if (!map[branch][day]) {
      map[branch][day] = [];
    }

    map[branch][day].push({
      ...schedule,
      index,
    });
  });

  return map;
}, [viewScheduleModal.schedules]);


  const filteredDentists = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return dentists.filter((dentist) => {
      const scheduleText = (dentist.schedules || [])
        .map(
          (schedule) =>
            `${normalizeBranchStr(schedule.branch)} ${normalizeDay(schedule.day)} ${schedule.time}`
        )
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !keyword ||
        (dentist.email || "").toLowerCase().includes(keyword) ||
        (dentist.name || "").toLowerCase().includes(keyword) ||
        (dentist.contactNumber || "").toLowerCase().includes(keyword) ||
        (dentist.specialty || "").toLowerCase().includes(keyword) ||
        scheduleText.includes(keyword);

      const matchesBranch =
        branchFilter === "All Branches" ||
        (dentist.schedules || []).some(
          (schedule) =>
            normalizeBranchStr(schedule.branch) === normalizeBranchStr(branchFilter)
        );

      return matchesSearch && matchesBranch;
    });
  }, [dentists, searchTerm, branchFilter]);

  const groupedPendingSchedules = useMemo(() => {
    const grouped = {};

    pendingSchedules.forEach((schedule, index) => {
      const key = normalizeBranchStr(schedule.branch);
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push({ ...schedule, index });
    });

    return grouped;
  }, [pendingSchedules]);

  const totalDentists = filteredDentists.length;
  const activeDentists = filteredDentists.filter(
    (dentist) => dentist.status === "Active"
  ).length;
  const inactiveDentists = filteredDentists.filter(
    (dentist) => dentist.status === "Disabled" || dentist.status === "Inactive"
  ).length;

  const allVisibleSelected =
    filteredDentists.length > 0 &&
    filteredDentists.every((dentist) => selectedIds.includes(dentist.id));

  const handleMarkAllRead = () => {
    setNotifications([]);
    setIsNotificationOpen(false);
  };

  const toggleScheduleDay = (day) => {
    setScheduleForm((prev) => {
      const exists = prev.days.includes(day);

      return {
        ...prev,
        days: exists
          ? prev.days.filter((item) => item !== day)
          : [...prev.days, day],
      };
    });
  };

  const handleAddPendingSchedule = () => {
    if (scheduleForm.days.length === 0) {
      alert("Please select at least one day.");
      return;
    }

    const startMinutes = convertTimeToMinutes(scheduleForm.startTime);
    const endMinutes = convertTimeToMinutes(scheduleForm.endTime);

    if (startMinutes >= endMinutes) {
      alert("End time must be later than start time.");
      return;
    }

    const timeRange = buildTimeRange(scheduleForm.startTime, scheduleForm.endTime);

    const newSchedules = scheduleForm.days.map((day) => ({
      branch: scheduleForm.branch,
      day,
      time: timeRange,
    }));

    const uniqueSchedules = newSchedules.filter(
      (newSchedule) =>
        !pendingSchedules.some((existing) => isSameSchedule(existing, newSchedule))
    );

    if (uniqueSchedules.length === 0) {
      alert("These schedules already exist for this dentist.");
      return;
    }

    setPendingSchedules((prev) => [...prev, ...uniqueSchedules]);
    setScheduleForm(buildEmptyScheduleForm());
  };

  const handleRemovePendingSchedule = (indexToRemove) => {
    setPendingSchedules((prev) =>
      prev.filter((_, index) => index !== indexToRemove)
    );
  };

  const openRegisterButtonModal = () => {
    setForm({ email: "" });
    setPendingSchedules([]);
    setScheduleForm(buildEmptyScheduleForm());
    setIsRegisterModalOpen(true);
  };

  const closeRegisterButtonModal = () => {
    if (isSubmitting) return;

    setIsRegisterModalOpen(false);
    setForm({ email: "" });
    setPendingSchedules([]);
    setScheduleForm(buildEmptyScheduleForm());
  };

  const openListModal = () => {
    setIsListModalOpen(true);
  };

  const closeListModal = () => {
    setIsListModalOpen(false);
  };

  const openRegisterConfirmModal = (e) => {
    e.preventDefault();

    if (!form.email.trim() || pendingSchedules.length === 0) return;

    setConfirmModal({
      open: true,
      type: "register-dentist",
      ids: [],
      title: "Register Dentist Account",
      message: `Are you sure you want to register ${form.email.trim()} with ${pendingSchedules.length} schedule(s)?`,
      payload: {
        email: form.email.trim(),
        schedules: pendingSchedules,
      },
    });
  };

  const openSingleStatusModal = (dentist) => {
    const isActive = dentist.status === "Active";

    setConfirmModal({
      open: true,
      type: isActive ? "disable-single" : "enable-single",
      ids: [dentist.id],
      title: isActive ? "Disable Dentist Account" : "Enable Dentist Account",
      message: isActive
        ? `Are you sure you want to disable ${dentist.email}?`
        : `Are you sure you want to enable ${dentist.email}?`,
      payload: null,
    });
  };

  const openBulkDisableModal = () => {
    if (selectedIds.length === 0) return;

    setConfirmModal({
      open: true,
      type: "disable-multiple",
      ids: selectedIds,
      title: "Disable Selected Accounts",
      message: `Are you sure you want to disable ${selectedIds.length} selected account(s)?`,
      payload: null,
    });
  };

  const openBulkEnableModal = () => {
    if (selectedIds.length === 0) return;

    setConfirmModal({
      open: true,
      type: "enable-multiple",
      ids: selectedIds,
      title: "Enable Selected Accounts",
      message: `Are you sure you want to enable ${selectedIds.length} selected account(s)?`,
      payload: null,
    });
  };

  const closeConfirmModal = () => {
    if (isSubmitting) return;

    setConfirmModal({
      open: false,
      type: "",
      ids: [],
      title: "",
      message: "",
      payload: null,
    });
  };

  const handleConfirmAction = async () => {
    const { type, ids, payload } = confirmModal;

    if (type === "register-dentist" && payload) {
      setIsSubmitting(true);
      const res = await createSuperAdminDentist({
        email: payload.email,
        schedules: payload.schedules,
        name: "New Dentist",
        contactNumber: "Not Set",
        specialty: "General Dentistry",
        yearsExperience: 0,
      });
      setIsSubmitting(false);

      if (res?.success) {
        await fetchDentists();
        setForm({ email: "" });
        setPendingSchedules([]);
        setScheduleForm(buildEmptyScheduleForm());
        setIsRegisterModalOpen(false);
      } else {
        alert(res?.message || "Failed to create dentist account.");
      }
    }

    if (type === "disable-single" || type === "disable-multiple") {
      setIsSubmitting(true);
      const results = await Promise.all(
        ids.map((id) => updateSuperAdminDentistStatus(id, false))
      );
      setIsSubmitting(false);

      if (results.some((result) => !result?.success)) {
        alert(
          results.find((result) => !result?.success)?.message ||
            "Failed to disable one or more dentist accounts."
        );
      }

      await fetchDentists();
      setSelectedIds([]);
    }

    if (type === "enable-single" || type === "enable-multiple") {
      setIsSubmitting(true);
      const results = await Promise.all(
        ids.map((id) => updateSuperAdminDentistStatus(id, true))
      );
      setIsSubmitting(false);

      if (results.some((result) => !result?.success)) {
        alert(
          results.find((result) => !result?.success)?.message ||
            "Failed to enable one or more dentist accounts."
        );
      }

      await fetchDentists();
      setSelectedIds([]);
    }

    closeConfirmModal();
  };

  const toggleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      const visibleIds = filteredDentists.map((dentist) => dentist.id);
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
      return;
    }

    const visibleIds = filteredDentists.map((dentist) => dentist.id);
    setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
  };

  const openViewScheduleModal = (dentist) => {
    const normalizedSchedules = (dentist.schedules || []).map((schedule) => ({
      branch: normalizeBranchStr(schedule.branch),
      day: normalizeDay(schedule.day),
      time: schedule.time,
      
    }));

    setViewScheduleModal({
      open: true,
      dentistId: dentist.id,
      dentistEmail: dentist.email,
      dentistName: dentist.name || "New Dentist",
      schedules: normalizedSchedules,
      isEditMode: false,
      scheduleForm: buildEmptyEditScheduleForm(),
    });
    setEditingScheduleIndex(null);
    setIsEditingExistingSchedule(false);
  };

  const closeViewScheduleModal = () => {
    if (isSubmitting) return;

    setViewScheduleModal({
      open: false,
      dentistId: null,
      dentistEmail: "",
      dentistName: "",
      schedules: [],
      isEditMode: false,
      scheduleForm: buildEmptyEditScheduleForm(),
    });
    setEditingScheduleIndex(null);
  setIsEditingExistingSchedule(false);
  };

  const handleAddViewSchedule = () => {
  const selectedDays = viewScheduleModal.scheduleForm.days || [];

  if (selectedDays.length === 0) {
    alert("Please select at least one day.");
    return;
  }

  const startMinutes = convertTimeToMinutes(viewScheduleModal.scheduleForm.startTime);
  const endMinutes = convertTimeToMinutes(viewScheduleModal.scheduleForm.endTime);

  if (startMinutes >= endMinutes) {
    alert("End time must be later than start time.");
    return;
  }

  const timeRange = buildTimeRange(
    viewScheduleModal.scheduleForm.startTime,
    viewScheduleModal.scheduleForm.endTime
  );

  if (isEditingExistingSchedule && editingScheduleIndex !== null) {
    const updatedSchedule = {
      branch: viewScheduleModal.scheduleForm.branch,
      day: selectedDays[0],
      time: timeRange,
    };

    const duplicateExists = viewScheduleModal.schedules.some((schedule, index) => {
      if (index === editingScheduleIndex) return false;
      return isSameSchedule(schedule, updatedSchedule);
    });

    if (duplicateExists) {
      alert("This schedule already exists for this dentist.");
      return;
    }

    setViewScheduleModal((prev) => ({
      ...prev,
      schedules: prev.schedules.map((schedule, index) =>
        index === editingScheduleIndex ? updatedSchedule : schedule
      ),
      scheduleForm: buildEmptyEditScheduleForm(),
    }));

    setEditingScheduleIndex(null);
    setIsEditingExistingSchedule(false);
    return;
  }

  const newSchedules = selectedDays.map((day) => ({
    branch: viewScheduleModal.scheduleForm.branch,
    day,
    time: timeRange,
  }));

  const uniqueSchedules = newSchedules.filter(
    (newSchedule) =>
      !viewScheduleModal.schedules.some((existing) =>
        isSameSchedule(existing, newSchedule)
      )
  );

  if (uniqueSchedules.length === 0) {
    alert("These schedules already exist for this dentist.");
    return;
  }

  setViewScheduleModal((prev) => ({
    ...prev,
    schedules: [...prev.schedules, ...uniqueSchedules],
    scheduleForm: buildEmptyEditScheduleForm(),
  }));
};

  const handleRemoveViewSchedule = (indexToRemove) => {
    setViewScheduleModal((prev) => ({
      ...prev,
      schedules: prev.schedules.filter((_, index) => index !== indexToRemove),
    }));
    if (editingScheduleIndex === indexToRemove) {
      setEditingScheduleIndex(null);
      setIsEditingExistingSchedule(false);
    }
  };

    const handleEditExistingSchedule = (schedule, index) => {
      if (isEditingExistingSchedule && editingScheduleIndex === index) {
        resetViewScheduleEditor();
        return;
      }

      const { startTime, endTime } = splitTimeRange(schedule.time);

      setViewScheduleModal((prev) => ({
        ...prev,
        isEditMode: true,
        scheduleForm: {
          branch: schedule.branch,
          days: [schedule.day],
          startTime,
          endTime,
        },
      }));

      setEditingScheduleIndex(index);
      setIsEditingExistingSchedule(true);
    };

  const handleSaveViewedSchedules = async () => {
    if (!viewScheduleModal.dentistId) return;

    setIsSubmitting(true);
    const res = await updateSuperAdminDentistSchedules(
      viewScheduleModal.dentistId,
      viewScheduleModal.schedules
    );
    setIsSubmitting(false);

    if (!res?.success) {
      alert(res?.message || "Failed to save schedule changes.");
      return;
    }

    await fetchDentists();
    closeViewScheduleModal();
  };

  const handleExportPDF = () => {
    const logoUrl =
      typeof logo === "string"
        ? logo
        : new URL("../../assets/logo.png", import.meta.url).href;

    const rowsHtml =
      filteredDentists.length > 0
        ? filteredDentists
            .map(
              (dentist, index) => `
                <tr>
                <td>${index + 1}</td>
                  <td>${dentist.name || "Not set yet"}</td>
                  <td>${dentist.contactNumber || "Not set yet"}</td>
                  <td>${dentist.email || "-"}</td>
                  <td>${dentist.status || "-"}</td>
                </tr>
              `
            )
            .join("")
        : `
          <tr>
            <td colspan="5" style="text-align:center; padding:18px; color:#8a90a2;">
              No dentist records found.
            </td>
          </tr>
        `;
    
        const scheduleMatrixHtml = REGISTER_BRANCHES.map((branch) => {
            const dayCells = DAYS.map((day) => {
              const matchingSchedules = filteredDentists.flatMap((dentist) =>
                (dentist.schedules || [])
                  .filter(
                    (schedule) =>
                      normalizeBranchStr(schedule.branch) === normalizeBranchStr(branch) &&
                      normalizeDay(schedule.day) === day
                  )
                  .map(
                    (schedule) => `
                      <div class="pdf-schedule-event ${dentist.status === "Active" ? "active" : "disabled"}">
                        <strong>${dentist.name || dentist.email}</strong>
                        <span>${schedule.time}</span>
                      </div>
                    `
                  )
              ).join("");

              return `
                <td class="pdf-weekly-cell">
                  ${
                    matchingSchedules
                      ? matchingSchedules
                      : `<div class="pdf-weekly-empty">—</div>`
                  }
                </td>
              `;
            }).join("");

            return `
              <tr>
                <td class="pdf-weekly-branch">${branch}</td>
                ${dayCells}
              </tr>
            `;
          }).join("");

    const printWindow = window.open("", "_blank", "width=1200,height=900");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Dentist Management Report</title>
          <style>
            * { box-sizing: border-box; }
            @page { size: A4 landscape; margin: 12mm; }
            body {
              margin: 0;
              padding: 0;
              font-family: Arial, Helvetica, sans-serif;
              background: #ffffff;
              color: #222;
              font-size: 13px;
              line-height: 1.35;
            }
            .report-container { width: 100%; }
            .report-header {
              display: flex;
              align-items: center;
              gap: 14px;
              border-bottom: 2px solid #ef4b84;
              padding-bottom: 10px;
              margin-bottom: 14px;
            }
            .report-logo {
              width: 54px;
              height: 54px;
              object-fit: contain;
              flex-shrink: 0;
            }
            .report-title-wrap { flex: 1; min-width: 0; }
            .report-title {
              margin: 0;
              font-size: 24px;
              font-weight: 800;
              color: #a52d63;
              line-height: 1.1;
            }
            .report-subtitle {
              margin: 4px 0 0;
              font-size: 13px;
              color: #666;
            }
            .report-filter-note {
              margin: 6px 0 0;
              font-size: 12px;
              color: #7a7a7a;
            }
            .section { margin-bottom: 14px; }
            .summary-section { page-break-inside: avoid; }
            .table-section { page-break-inside: auto; }
            .section-title {
              margin: 0 0 8px;
              font-size: 13px;
              font-weight: 800;
              color: #a52d63;
              text-transform: uppercase;
              letter-spacing: 0.4px;
            }
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 10px;
            }
            .stat-card {
              border: 1px solid #f1d7e3;
              border-radius: 10px;
              background: #ffffff;
              padding: 10px 12px;
              min-height: 72px;
            }
            .stat-label {
              font-size: 11px;
              color: #777;
              margin-bottom: 6px;
            }
            .stat-value {
              font-size: 24px;
              font-weight: 800;
              color: #ef4b84;
              line-height: 1;
            }
            .table-wrap {
              border: 1px solid #f1d7e3;
              border-radius: 12px;
              overflow: visible;
              background: #ffffff;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              table-layout: fixed;
            }
            thead {
              display: table-header-group;
              background: #fff5f9;
            }
            tr {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            th, td {
              border-bottom: 1px solid #f3dbe5;
              padding: 10px 8px;
              text-align: left;
              vertical-align: top;
              font-size: 12px;
              word-break: break-word;
            }
            th {
              color: #7b4b61;
              font-weight: 700;
            }
            tbody tr:nth-child(even) {
              background: #fffdfd;
            }
            .col-no { width: 8%; }
            .col-name { width: 28%; }
            .col-contact { width: 22%; }
            .col-email { width: 28%; }
            .col-status { width: 14%; }
            .footer-note {
              margin-top: 12px;
              font-size: 10px;
              color: #888;
              text-align: right;
            }
            @media print {
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              thead { display: table-header-group; }
              table { page-break-inside: auto; }
              tr, td, th { page-break-inside: avoid; }

              .weekly-schedule-section {
                  margin-top: 8px;
                  page-break-inside: auto;
                }

                .weekly-schedule-wrap {
                  border: 1px solid #f1d7e3;
                  border-radius: 12px;
                  overflow: hidden;
                  background: #ffffff;
                }

                .weekly-schedule-table {
                  width: 100%;
                  border-collapse: collapse;
                  table-layout: fixed;
                }

                .weekly-schedule-table th,
                .weekly-schedule-table td {
                  border: 1px solid #f3dbe5;
                  padding: 8px;
                  vertical-align: top;
                  font-size: 11px;
                }

                .weekly-schedule-table th {
                  background: #fff5f9;
                  color: #7b4b61;
                  font-weight: 700;
                  text-align: center;
                }

                .pdf-weekly-branch {
                  font-weight: 700;
                  color: #495167;
                  background: #fffafb;
                }

                .pdf-weekly-cell {
                  min-height: 90px;
                }

                .pdf-schedule-event {
                  border-radius: 10px;
                  padding: 6px 8px;
                  margin-bottom: 6px;
                  line-height: 1.35;
                }

                .pdf-schedule-event strong {
                  display: block;
                  font-size: 11px;
                  margin-bottom: 2px;
                }

                .pdf-schedule-event span {
                  font-size: 10px;
                }

                .pdf-schedule-event.active {
                  background: #fff0f6;
                  border: 1px solid #f4c5d7;
                  color: #8f3e69;
                }

                .pdf-schedule-event.disabled {
                  background: #f7f1f4;
                  border: 1px solid #ead7df;
                  color: #8b7280;
                }

                .pdf-weekly-empty {
                  text-align: center;
                  color: #b1b7c5;
                  padding-top: 12px;
                }
            }
          </style>
        </head>
        <body>
          <div class="report-container">
            <div class="report-header">
              <img src="${logoUrl}" alt="GC Dental Care Logo" class="report-logo" />
              <div class="report-title-wrap">
                <h1 class="report-title">Dentist Management Report</h1>
                <p class="report-subtitle">GC Dental Care • Powered by Intellident</p>
                <p class="report-filter-note">Branch Filter: ${branchFilter}</p>
              </div>
            </div>

            <div class="section summary-section">
              <h2 class="section-title">Totals Summary</h2>
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-label">Total Dentist</div>
                  <div class="stat-value">${totalDentists}</div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">Active Dentist</div>
                  <div class="stat-value">${activeDentists}</div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">Inactive Dentist</div>
                  <div class="stat-value">${inactiveDentists}</div>
                </div>
              </div>
            </div>

            <div class="section table-section">
              <h2 class="section-title">Dentist List</h2>
              <div class="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th class="col-no">No.</th>
                      <th class="col-name">Name</th>
                      <th class="col-contact">Contact Number</th>
                      <th class="col-email">Email</th>
                      <th class="col-status">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${rowsHtml}
                  </tbody>
                </table>
              </div>
            </div>

            <div class="section weekly-schedule-section">
            <div class="weekly-schedule-wrap">
              <table class="weekly-schedule-table">
                <thead>
                  <tr>
                    <th>Branch</th>
                    ${DAYS.map((day) => `<th>${day}</th>`).join("")}
                  </tr>
                </thead>
                <tbody>
                  ${scheduleMatrixHtml}
                </tbody>
              </table>
            </div>
          </div>

            <div class="footer-note">
              Generated on ${new Date().toLocaleString()}
            </div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
    }, 700);
  };

  return (
    <div className="admin-dashboard-page">
      <SuperAdminSidebar />

      <main className="admin-main-content">
        <SuperAdminTopbar
          title="Dentist Management"
          notifications={notifications}
          isNotificationOpen={isNotificationOpen}
          onToggleNotifications={() => setIsNotificationOpen((prev) => !prev)}
          onCloseNotifications={() => setIsNotificationOpen(false)}
          onMarkAllRead={handleMarkAllRead}
        />

        <div className="superadmin-dentists-fixed-page">
          <div className="superadmin-dentists-content">
            <section className="superadmin-dentists-header">
              <div className="superadmin-dentists-header-top">
                <div>
                  <h2 className="superadmin-dentists-title">Dentist Management</h2>
                  <p className="superadmin-dentists-subtitle">
                    Register dentists, assign multiple schedules, and manage account
                    status.
                  </p>
                </div>

                <div className="superadmin-dentists-header-actions">
                  <select
                    value={branchFilter}
                    onChange={(e) => setBranchFilter(e.target.value)}
                    className="superadmin-dentists-branch-filter"
                  >
                    {BRANCHES.map((branch) => (
                      <option key={branch} value={branch}>
                        {branch}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    className="superadmin-dentists-header-btn register-btn"
                    onClick={openRegisterButtonModal}
                  >
                    Register Dentist
                  </button>

                  <button
                    type="button"
                    className="superadmin-dentists-header-btn list-btn"
                    onClick={openListModal}
                  >
                    Dentist List
                  </button>

                  <button
                    type="button"
                    className="superadmin-export-btn"
                    onClick={handleExportPDF}
                  >
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path
                        d="M12 3V14"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                      <path
                        d="M8.5 10.5L12 14L15.5 10.5"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M5 16.5V18C5 19.1 5.9 20 7 20H17C18.1 20 19 19.1 19 18V16.5"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                    </svg>
                    <span>Export PDF</span>
                  </button>
                </div>
              </div>
            </section>

            <section className="superadmin-dentists-stats">
              <div className="superadmin-dentist-stat-card">
                <span>Total Dentist</span>
                <h3>{totalDentists}</h3>
              </div>

              <div className="superadmin-dentist-stat-card">
                <span>Active Dentist</span>
                <h3>{activeDentists}</h3>
              </div>

              <div className="superadmin-dentist-stat-card">
                <span>Inactive Dentist</span>
                <h3>{inactiveDentists}</h3>
              </div>
            </section>

            <section className="superadmin-dentists-calendar-card">
              <div className="superadmin-dentists-card-head">
                <div>
                  <h3>Weekly Schedule View</h3>
                  <p>Calendar-style view of all dentist schedules.</p>
                </div>
              </div>

              <div className="superadmin-dentists-calendar-grid">
                <div className="superadmin-dentists-calendar-header-cell">Branch</div>
                {DAYS.map((day) => (
                  <div
                    key={day}
                    className="superadmin-dentists-calendar-header-cell"
                  >
                    {day}
                  </div>
                ))}

                {REGISTER_BRANCHES.map((branch) => (
                  <div className="superadmin-dentists-calendar-row" key={branch}>
                    <div className="superadmin-dentists-calendar-branch-cell">
                      {branch}
                    </div>

                    {DAYS.map((day) => {
                      const matchingSchedules = filteredDentists.flatMap((dentist) =>
                        (dentist.schedules || [])
                          .filter(
                            (schedule) =>
                              normalizeBranchStr(schedule.branch) ===
                                normalizeBranchStr(branch) &&
                              normalizeDay(schedule.day) === day
                          )
                          .map((schedule, index) => ({
                            dentistId: dentist.id,
                            dentistEmail: dentist.email,
                            dentistName: dentist.name,
                            status: dentist.status,
                            scheduleId: `${dentist.id}-${index}-${schedule.time}`,
                            time: schedule.time,
                          }))
                      );

                      return (
                        <div
                          key={`${branch}-${day}`}
                          className="superadmin-dentists-calendar-day-cell"
                        >
                          {matchingSchedules.length > 0 ? (
                            matchingSchedules.map((item) => (
                              <div
                                key={item.scheduleId}
                                className={`superadmin-dentists-calendar-event ${
                                  item.status === "Active"
                                    ? "is-active"
                                    : "is-disabled"
                                }`}
                              >
                                <strong>
                                  {item.dentistName || item.dentistEmail}
                                </strong>
                                <span>{item.time}</span>
                              </div>
                            ))
                          ) : (
                            <span className="superadmin-dentists-calendar-empty">
                              —
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>

      {isRegisterModalOpen && (
        <div
          className="superadmin-dentists-modal-overlay"
          onClick={closeRegisterButtonModal}
        >
          <div
            className="superadmin-dentists-modal superadmin-dentists-register-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="superadmin-dentists-register-modal-body">
              <ModalHeader
                title="Register Dentist"
                subtitle="Email and schedule details are required for registration."
                onClose={closeRegisterButtonModal}
              />

              <form
                onSubmit={openRegisterConfirmModal}
                className="superadmin-dentists-form-stack"
                style={{ marginTop: "18px" }}
              >
                <div className="superadmin-dentists-field">
                  <label>Email</label>
                  <input
                    type="email"
                    placeholder="dentist@email.com"
                    value={form.email}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, email: e.target.value }))
                    }
                  />
                </div>

                <div className="superadmin-dentists-schedule-builder superadmin-dentists-schedule-builder-wide">
                  <div className="superadmin-dentists-schedule-top-grid">
                    <div className="superadmin-dentists-field">
                      <label>Branch</label>
                      <select
                        value={scheduleForm.branch}
                        onChange={(e) =>
                          setScheduleForm((prev) => ({
                            ...prev,
                            branch: e.target.value,
                          }))
                        }
                      >
                        {REGISTER_BRANCHES.map((branch) => (
                          <option key={branch} value={branch}>
                            {branch}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="superadmin-dentists-time-range-group">
                      <div className="superadmin-dentists-field">
                        <label>Start Time</label>
                        <select
                          value={scheduleForm.startTime}
                          onChange={(e) =>
                            setScheduleForm((prev) => ({
                              ...prev,
                              startTime: e.target.value,
                            }))
                          }
                        >
                          {TIME_SLOT_OPTIONS.map((time) => (
                            <option key={time} value={time}>
                              {time}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="superadmin-dentists-field">
                        <label>End Time</label>
                        <select
                          value={scheduleForm.endTime}
                          onChange={(e) =>
                            setScheduleForm((prev) => ({
                              ...prev,
                              endTime: e.target.value,
                            }))
                          }
                        >
                          {TIME_SLOT_OPTIONS.map((time) => (
                            <option key={time} value={time}>
                              {time}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="superadmin-dentists-form-action">
                      <button
                        type="button"
                        onClick={handleAddPendingSchedule}
                        className="superadmin-dentists-secondary-btn add-schedule-btn"
                      >
                        Add Schedule
                      </button>
                    </div>
                  </div>

                  <div className="superadmin-dentists-field">
                    <label>Select Day(s)</label>
                    <div className="superadmin-dentists-day-picker">
                      {DAYS.map((day) => {
                        const isSelected = scheduleForm.days.includes(day);

                        return (
                          <button
                            key={day}
                            type="button"
                            className={`superadmin-dentists-day-chip ${
                              isSelected ? "active" : ""
                            }`}
                            onClick={() => toggleScheduleDay(day)}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="superadmin-dentists-added-schedules superadmin-dentists-added-schedules-grid">
                    {Object.keys(groupedPendingSchedules).length > 0 ? (
                      Object.entries(groupedPendingSchedules).map(
                        ([branch, schedules]) => (
                          <div
                            key={branch}
                            className="superadmin-dentists-schedule-group-card"
                          >
                            <div className="superadmin-dentists-schedule-group-head">
                              <h4>{branch}</h4>
                              <span>{schedules.length} schedule(s)</span>
                            </div>

                            <div className="superadmin-dentists-schedule-group-list">
                              {schedules.map((schedule) => (
                                <div
                                  key={`${schedule.branch}-${schedule.day}-${schedule.time}-${schedule.index}`}
                                  className="superadmin-dentists-schedule-row"
                                >
                                  <div className="superadmin-dentists-schedule-row-main">
                                    <span className="schedule-day">
                                      {schedule.day}
                                    </span>
                                    <span className="schedule-time">
                                      {schedule.time}
                                    </span>
                                  </div>

                                  <button
                                    type="button"
                                    className="superadmin-dentists-schedule-remove"
                                    onClick={() =>
                                      handleRemovePendingSchedule(schedule.index)
                                    }
                                    aria-label={`Remove ${schedule.day} ${schedule.time}`}
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      )
                    ) : (
                      <div className="superadmin-dentists-schedule-empty-box">
                        <p className="superadmin-dentists-schedule-empty">
                          No schedules added yet.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="superadmin-dentists-modal-actions">
                  <button
                    type="button"
                    className="superadmin-dentists-modal-cancel"
                    onClick={closeRegisterButtonModal}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="superadmin-dentists-modal-confirm"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Registering..." : "Register Dentist"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {isListModalOpen && (
        <div
          className="superadmin-dentists-modal-overlay"
          onClick={closeListModal}
        >
          <div
            className="superadmin-dentists-modal superadmin-dentists-list-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="superadmin-dentists-list-modal-body">
              <ModalHeader
                title="Dentist List"
                subtitle="Only the list area scrolls when there are many records."
                onClose={closeListModal}
              />
              <div className="superadmin-dentists-card-head superadmin-dentists-card-head-wrap">

                <div className="superadmin-dentists-top-actions">
                  <input
                    type="text"
                    placeholder="Search name, email, branch, day..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="superadmin-dentists-search"
                  />

                  {selectedIds.length > 0 && (
                    <div className="superadmin-dentists-bulk-actions">
                      <button
                        type="button"
                        onClick={openBulkEnableModal}
                        className="superadmin-dentists-secondary-btn enable-selected-btn"
                      >
                        Enable Selected
                      </button>

                      <button
                        type="button"
                        onClick={openBulkDisableModal}
                        className="superadmin-dentists-secondary-btn"
                      >
                        Disable Selected
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="superadmin-dentists-list-table-scroll">
                <table className="superadmin-dentists-list-table">
                  <thead>
                    <tr>
                      <th>
                        <input
                          type="checkbox"
                          checked={allVisibleSelected}
                          onChange={toggleSelectAllVisible}
                        />
                      </th>
                      <th>Name</th>
                      <th>Contact Number</th>
                      <th>Email</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredDentists.map((dentist) => (
                      <tr key={dentist.id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(dentist.id)}
                            onChange={() => toggleSelectOne(dentist.id)}
                          />
                        </td>

                        <td className="superadmin-dentists-name-cell">
                          {dentist.name || (
                            <span className="superadmin-dentists-empty-text">
                              Not set yet
                            </span>
                          )}
                        </td>

                        <td>
                          {dentist.contactNumber || (
                            <span className="superadmin-dentists-empty-text">
                              Not set yet
                            </span>
                          )}
                        </td>

                        <td className="superadmin-dentists-email-cell">
                          {dentist.email}
                        </td>

                        <td>
                          <span
                            className={`superadmin-dentists-status ${
                              dentist.status === "Active"
                                ? "is-active"
                                : "is-disabled"
                            }`}
                          >
                            {dentist.status}
                          </span>
                        </td>

                        <td>
                          <div className="superadmin-dentists-action-stack">
                            <button
                              type="button"
                              onClick={() => openViewScheduleModal(dentist)}
                              className="superadmin-dentists-action-btn edit-btn"
                            >
                              View Schedule
                            </button>

                            <button
                              type="button"
                              onClick={() => openSingleStatusModal(dentist)}
                              className={`superadmin-dentists-action-btn ${
                                dentist.status === "Active"
                                  ? "disable-btn"
                                  : "enable-btn"
                              }`}
                            >
                              {dentist.status === "Active" ? "Disable" : "Enable"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {filteredDentists.length === 0 && (
                      <tr>
                        <td colSpan="6">
                          <div className="superadmin-dentists-empty-state">
                            No dentist records found.
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          </div>
        </div>
      )}

      {confirmModal.open && (
        <div
          className="superadmin-dentists-modal-overlay"
          onClick={closeConfirmModal}
        >
          <div
            className="superadmin-dentists-modal"
            onClick={(e) => e.stopPropagation()}
            
          >
            <ModalHeader
              title={confirmModal.title}
              onClose={closeConfirmModal}
            />
            <p>{confirmModal.message}</p>

            <div className="superadmin-dentists-modal-actions">
              <button
                type="button"
                className="superadmin-dentists-modal-cancel"
                onClick={closeConfirmModal}
              >
                Cancel
              </button>

              <button
                type="button"
                className="superadmin-dentists-modal-confirm"
                onClick={handleConfirmAction}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Processing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {viewScheduleModal.open && (
        <div
          className="superadmin-dentists-modal-overlay"
          onClick={closeViewScheduleModal}
        >
          <div
            className="superadmin-dentists-modal superadmin-dentists-edit-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="superadmin-dentists-edit-modal-inner">
            <ModalHeader
              title={viewScheduleModal.isEditMode ? "Edit Schedule" : "View Schedule"}
              subtitle={`${viewScheduleModal.dentistName} • ${viewScheduleModal.dentistEmail}`}
              onClose={closeViewScheduleModal}
            />

            <div className="superadmin-dentists-view-schedule-header">
              <span>
                Total Schedule: {viewScheduleModal.schedules.length}
              </span>

              {!viewScheduleModal.isEditMode ? (
                <button
                  type="button"
                  className="superadmin-dentists-secondary-btn add-schedule-btn"
                  onClick={() =>
                    setViewScheduleModal((prev) => ({
                      ...prev,
                      isEditMode: true,
                    }))
                  }
                >
                  Edit Schedule
                </button>
              ) : (
                <button
                  type="button"
                  className="superadmin-dentists-secondary-btn"
                  onClick={() => {
                    setViewScheduleModal((prev) => ({
                      ...prev,
                      isEditMode: false,
                    }));
                    resetViewScheduleEditor();
                  }}
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <div className="superadmin-dentists-view-calendar-wrap">
              <div className="superadmin-dentists-view-calendar-grid">
                <div className="superadmin-dentists-calendar-header-cell">Branch</div>
                {DAYS.map((day) => (
                  <div
                    key={`view-header-${day}`}
                    className="superadmin-dentists-calendar-header-cell"
                  >
                    {day}
                  </div>
                ))}

                {REGISTER_BRANCHES.map((branch) => (
                  <div className="superadmin-dentists-calendar-row" key={`view-row-${branch}`}>
                    <div className="superadmin-dentists-calendar-branch-cell">
                      {branch}
                    </div>

                    {DAYS.map((day) => {
                      const items = viewScheduleCalendarMap?.[branch]?.[day] || [];

                      return (
                        <div
                          key={`${branch}-${day}`}
                          className={`superadmin-dentists-calendar-day-cell superadmin-dentists-view-day-cell ${
                            viewScheduleModal.isEditMode ? "is-editing" : ""
                          }`}
                        >
                          {items.length > 0 ? (
                            items.map((item) => (
                              <div
                                key={`${item.branch}-${item.day}-${item.time}-${item.index}`}
                                className={`superadmin-dentists-calendar-event is-active superadmin-dentists-view-event ${
                                  viewScheduleModal.isEditMode ? "is-clickable" : ""
                                } ${
                                  isEditingExistingSchedule && editingScheduleIndex === item.index
                                    ? "is-selected"
                                    : ""
                                }`}
                                onClick={() =>
                                  viewScheduleModal.isEditMode
                                    ? handleEditExistingSchedule(item, item.index)
                                    : null
                                }
                              >
                                <strong>{item.time}</strong>
                                <span>{item.branch}</span>

                                {viewScheduleModal.isEditMode && (
                                  <button
                                    type="button"
                                    className="superadmin-dentists-schedule-remove inline-remove calendar-remove"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveViewSchedule(item.index);
                                    }}
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                            ))
                          ) : (
                            <span className="superadmin-dentists-calendar-empty">—</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {viewScheduleModal.isEditMode && (
              <>
                <div className="superadmin-dentists-schedule-builder superadmin-dentists-schedule-builder-wide superadmin-dentists-edit-schedule-builder">
                  <div className="superadmin-dentists-schedule-top-grid">
                    <div className="superadmin-dentists-field">
                      <label>Branch</label>
                      <select
                        value={viewScheduleModal.scheduleForm.branch}
                        onChange={(e) =>
                          setViewScheduleModal((prev) => ({
                            ...prev,
                            scheduleForm: {
                              ...prev.scheduleForm,
                              branch: e.target.value,
                            },
                          }))
                        }
                      >
                        {REGISTER_BRANCHES.map((branch) => (
                          <option key={branch} value={branch}>
                            {branch}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="superadmin-dentists-time-range-group">
                      <div className="superadmin-dentists-field">
                        <label>Start Time</label>
                        <select
                          value={viewScheduleModal.scheduleForm.startTime}
                          onChange={(e) =>
                            setViewScheduleModal((prev) => ({
                              ...prev,
                              scheduleForm: {
                                ...prev.scheduleForm,
                                startTime: e.target.value,
                              },
                            }))
                          }
                        >
                          {TIME_SLOT_OPTIONS.map((time) => (
                            <option key={time} value={time}>
                              {time}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="superadmin-dentists-field">
                        <label>End Time</label>
                        <select
                          value={viewScheduleModal.scheduleForm.endTime}
                          onChange={(e) =>
                            setViewScheduleModal((prev) => ({
                              ...prev,
                              scheduleForm: {
                                ...prev.scheduleForm,
                                endTime: e.target.value,
                              },
                            }))
                          }
                        >
                          {TIME_SLOT_OPTIONS.map((time) => (
                            <option key={time} value={time}>
                              {time}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="superadmin-dentists-form-action">
                      <button
                        type="button"
                        onClick={handleAddViewSchedule}
                        className="superadmin-dentists-secondary-btn add-schedule-btn"
                      >
                        {isEditingExistingSchedule ? "Update Schedule" : "Add Schedule"}
                      </button>
                       {isEditingExistingSchedule && (
                        <button
                          type="button"
                          className="superadmin-dentists-secondary-btn clear-selected-btn"
                          onClick={resetViewScheduleEditor}
                        >
                          Clear Selected
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="superadmin-dentists-field">
                    <label>Select Day(s)</label>
                    <div className="superadmin-dentists-day-picker">
                      {DAYS.map((day) => {
                        const isSelected = viewScheduleModal.scheduleForm.days.includes(day);

                        return (
                          <button
                            key={day}
                            type="button"
                            className={`superadmin-dentists-day-chip ${isSelected ? "active" : ""}`}
                            onClick={() => {
                              if (isEditingExistingSchedule) {
                                setViewScheduleModal((prev) => ({
                                  ...prev,
                                  scheduleForm: {
                                    ...prev.scheduleForm,
                                    days: [day],
                                  },
                                }));
                                return;
                              }

                              setViewScheduleModal((prev) => {
                                const exists = prev.scheduleForm.days.includes(day);

                                return {
                                  ...prev,
                                  scheduleForm: {
                                    ...prev.scheduleForm,
                                    days: exists
                                      ? prev.scheduleForm.days.filter((item) => item !== day)
                                      : [...prev.scheduleForm.days, day],
                                  },
                                };
                              });
                            }}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="superadmin-dentists-modal-actions">
                  <button
                    type="button"
                    className="superadmin-dentists-modal-cancel"
                    onClick={closeViewScheduleModal}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className="superadmin-dentists-modal-confirm"
                    onClick={handleSaveViewedSchedules}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Saving..." : "Save Schedule"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        </div>
      )}
    </div>
  );
}