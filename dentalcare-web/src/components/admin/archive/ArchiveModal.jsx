import { useEffect, useState } from "react";
import {
  getArchivedPatients,
  getArchivedPatientDetail,
  getArchivedBookings,
  getArchivedBookingDetail,
  getArchivedProcedures,
  getArchivedProcedureDetail,
} from "../../../services/adminService";
import "../../../styles/admin/archive/admin-archive-modal.css";

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" });
};

const TABS = [
  { key: "patients", label: "Archived Patients" },
  { key: "bookings", label: "Archived Appointments" },
  { key: "procedures", label: "Archived Procedures" },
];

const listFetchers = {
  patients: getArchivedPatients,
  bookings: getArchivedBookings,
  procedures: getArchivedProcedures,
};

const detailFetchers = {
  patients: getArchivedPatientDetail,
  bookings: getArchivedBookingDetail,
  procedures: getArchivedProcedureDetail,
};

export default function ArchiveModal({ open, onClose }) {
  const [activeTab, setActiveTab] = useState("patients");
  const [search, setSearch] = useState("");
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const loadList = async (tab, term) => {
    setIsLoading(true);
    setErrorMessage("");
    const result = await listFetchers[tab](term);
    if (result?.success) {
      setRecords(result.data || []);
    } else {
      setErrorMessage(result?.message || "Failed to load archived records.");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (!open) return;
    setActiveTab("patients");
    setSelectedId(null);
    setDetail(null);
    setSearch("");
    loadList("patients", "");
  }, [open]);

  if (!open) return null;

  const handleTabChange = (tabKey) => {
    if (tabKey === activeTab) return;
    setActiveTab(tabKey);
    setSelectedId(null);
    setDetail(null);
    setSearch("");
    loadList(tabKey, "");
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadList(activeTab, search);
  };

  const handleViewRecord = async (id) => {
    setSelectedId(id);
    setIsDetailLoading(true);
    setErrorMessage("");
    setDetail(null);
    const result = await detailFetchers[activeTab](id);
    if (result?.success) {
      setDetail(result.data);
    } else {
      setErrorMessage(result?.message || "Failed to load archived record.");
    }
    setIsDetailLoading(false);
  };

  const handleBackToList = () => {
    setSelectedId(null);
    setDetail(null);
  };

  return (
    <div className="archive-modal-overlay" onClick={onClose}>
      <div className="archive-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="archive-modal-close-btn" onClick={onClose}>
          ×
        </button>

        {!selectedId ? (
          <>
            <div className="archive-modal-top">
              <h2>Archived Records</h2>
              <p className="archive-modal-subtitle">
                Records 4+ years old are moved here automatically — patient accounts, individual
                appointments, and procedure logs are archived independently.
              </p>
            </div>

            <div className="archive-modal-tabs">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  className={`archive-modal-tab-btn ${activeTab === tab.key ? "active" : ""}`}
                  onClick={() => handleTabChange(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <form className="archive-modal-search-wrap" onSubmit={handleSearchSubmit}>
              <input
                type="text"
                placeholder="Search by patient name, service, or procedure"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button type="submit">Search</button>
            </form>

            {errorMessage ? <div className="archive-modal-error">{errorMessage}</div> : null}

            <div className="archive-modal-table-wrap">
              {activeTab === "patients" && (
                <table className="archive-modal-table">
                  <thead>
                    <tr>
                      <th>Patient Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Last Booking</th>
                      <th>Archived On</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr><td colSpan="6" className="archive-modal-empty">Loading...</td></tr>
                    ) : records.length > 0 ? (
                      records.map((record) => (
                        <tr key={record.id}>
                          <td>{record.full_name || "Unknown Patient"}</td>
                          <td>{record.email || "-"}</td>
                          <td>{record.mobile || "-"}</td>
                          <td>{formatDate(record.last_booking_date)}</td>
                          <td>{formatDate(record.archived_at)}</td>
                          <td>
                            <button type="button" className="archive-modal-view-btn" onClick={() => handleViewRecord(record.id)}>
                              View
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="6" className="archive-modal-empty">No archived patients found.</td></tr>
                    )}
                  </tbody>
                </table>
              )}

              {activeTab === "bookings" && (
                <table className="archive-modal-table">
                  <thead>
                    <tr>
                      <th>Patient Name</th>
                      <th>Service</th>
                      <th>Branch</th>
                      <th>Appointment Date</th>
                      <th>Archived On</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr><td colSpan="6" className="archive-modal-empty">Loading...</td></tr>
                    ) : records.length > 0 ? (
                      records.map((record) => (
                        <tr key={record.id}>
                          <td>{record.patient_name || "Unknown Patient"}</td>
                          <td>{record.service || "Dental Appointment"}</td>
                          <td>{record.branch || "-"}</td>
                          <td>{formatDate(record.appointment_date)}</td>
                          <td>{formatDate(record.archived_at)}</td>
                          <td>
                            <button type="button" className="archive-modal-view-btn" onClick={() => handleViewRecord(record.id)}>
                              View
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="6" className="archive-modal-empty">No archived appointments found.</td></tr>
                    )}
                  </tbody>
                </table>
              )}

              {activeTab === "procedures" && (
                <table className="archive-modal-table">
                  <thead>
                    <tr>
                      <th>Patient Name</th>
                      <th>Procedure</th>
                      <th>Record Date</th>
                      <th>Archived On</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr><td colSpan="5" className="archive-modal-empty">Loading...</td></tr>
                    ) : records.length > 0 ? (
                      records.map((record) => (
                        <tr key={record.id}>
                          <td>{record.patient_name || "Unknown Patient"}</td>
                          <td>{record.procedure_name || "Procedure"}</td>
                          <td>{formatDate(record.record_date)}</td>
                          <td>{formatDate(record.archived_at)}</td>
                          <td>
                            <button type="button" className="archive-modal-view-btn" onClick={() => handleViewRecord(record.id)}>
                              View
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="5" className="archive-modal-empty">No archived procedures found.</td></tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </>
        ) : (
          <div className="archive-modal-detail">
            <button type="button" className="archive-modal-back-btn" onClick={handleBackToList}>
              ← Back to list
            </button>

            {isDetailLoading ? (
              <div className="archive-modal-empty">Loading record...</div>
            ) : !detail ? (
              <div className="archive-modal-empty">Record not found.</div>
            ) : activeTab === "patients" ? (
              <PatientDetail detail={detail} formatDate={formatDate} />
            ) : activeTab === "bookings" ? (
              <BookingDetail detail={detail} formatDate={formatDate} />
            ) : (
              <ProcedureDetail detail={detail} formatDate={formatDate} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function PatientDetail({ detail, formatDate }) {
  return (
    <>
      <div className="archive-modal-top">
        <h2>{detail.fullName || "Unknown Patient"}</h2>
        <p className="archive-modal-subtitle">
          Archived on {formatDate(detail.archivedAt)} · Last booking {formatDate(detail.lastBookingDate)}
        </p>
      </div>

      <div className="archive-detail-grid">
        <div className="archive-detail-box">
          <label>Email</label>
          <p>{detail.email || "-"}</p>
        </div>
        <div className="archive-detail-box">
          <label>Phone</label>
          <p>{detail.mobile || "-"}</p>
        </div>
      </div>

      <h3 className="archive-section-title">Booking History ({detail.bookings?.length || 0})</h3>
      <div className="archive-detail-list">
        {(detail.bookings || []).length > 0 ? (
          detail.bookings.map((booking) => (
            <div className="archive-detail-card" key={booking.id}>
              <p><span>Service:</span> {booking.service || "Dental Appointment"}</p>
              <p><span>Branch:</span> {booking.branch || "-"}</p>
              <p><span>Date:</span> {formatDate(booking.appointment_date)} {booking.appointment_time || ""}</p>
              <p><span>Status:</span> {booking.status || "-"}</p>
            </div>
          ))
        ) : (
          <div className="archive-modal-empty">No bookings on record.</div>
        )}
      </div>

      <h3 className="archive-section-title">Procedures ({detail.procedures?.length || 0})</h3>
      <div className="archive-detail-list">
        {(detail.procedures || []).length > 0 ? (
          detail.procedures.map((procedure) => (
            <div className="archive-detail-card" key={procedure.id}>
              <p><span>Procedure:</span> {procedure.procedure_name || "-"}</p>
              <p><span>Tooth:</span> {procedure.tooth || "Not specified"}</p>
              <p><span>Remarks:</span> {procedure.remarks || "-"}</p>
            </div>
          ))
        ) : (
          <div className="archive-modal-empty">No procedures on record.</div>
        )}
      </div>
    </>
  );
}

function BookingDetail({ detail, formatDate }) {
  const booking = detail.booking || {};
  const procedures = detail.procedures || [];
  const preassessment = detail.preassessment;

  return (
    <>
      <div className="archive-modal-top">
        <h2>{detail.patientName || "Unknown Patient"}</h2>
        <p className="archive-modal-subtitle">
          Archived on {formatDate(detail.archivedAt)} · Appointment {formatDate(detail.appointmentDate)}
        </p>
      </div>

      <div className="archive-detail-grid">
        <div className="archive-detail-box">
          <label>Service</label>
          <p>{booking.service || "Dental Appointment"}</p>
        </div>
        <div className="archive-detail-box">
          <label>Branch</label>
          <p>{booking.branch || "-"}</p>
        </div>
        <div className="archive-detail-box">
          <label>Time</label>
          <p>{booking.appointment_time || "-"}</p>
        </div>
        <div className="archive-detail-box">
          <label>Status</label>
          <p>{booking.status || "-"}</p>
        </div>
      </div>

      <h3 className="archive-section-title">Procedure Logs ({procedures.length})</h3>
      <div className="archive-detail-list">
        {procedures.length > 0 ? (
          procedures.map((procedure) => (
            <div className="archive-detail-card" key={procedure.id}>
              <p><span>Procedure:</span> {procedure.procedure_name || "-"}</p>
              <p><span>Tooth:</span> {procedure.tooth || "Not specified"}</p>
              <p><span>Remarks:</span> {procedure.remarks || "-"}</p>
            </div>
          ))
        ) : (
          <div className="archive-modal-empty">No procedure logs on record.</div>
        )}
      </div>

      {preassessment ? (
        <>
          <h3 className="archive-section-title">Pre-Assessment</h3>
          <div className="archive-detail-card">
            <p><span>Suggested Treatment:</span> {preassessment.ai_service || "-"}</p>
            <p><span>Description:</span> {preassessment.description || "-"}</p>
          </div>
        </>
      ) : null}
    </>
  );
}

function ProcedureDetail({ detail, formatDate }) {
  const procedure = detail.procedure || {};

  return (
    <>
      <div className="archive-modal-top">
        <h2>{detail.patientName || "Unknown Patient"}</h2>
        <p className="archive-modal-subtitle">
          Archived on {formatDate(detail.archivedAt)} · Record date {formatDate(detail.recordDate)}
        </p>
      </div>

      <div className="archive-detail-grid">
        <div className="archive-detail-box">
          <label>Procedure</label>
          <p>{procedure.procedure_name || detail.procedureName || "-"}</p>
        </div>
        <div className="archive-detail-box">
          <label>Tooth</label>
          <p>{procedure.tooth || "Not specified"}</p>
        </div>
      </div>

      <h3 className="archive-section-title">Remarks</h3>
      <div className="archive-detail-card">
        <p>{procedure.remarks || "No remarks on record."}</p>
      </div>

      {(procedure.before_image_url || procedure.after_image_url) && (
        <>
          <h3 className="archive-section-title">Photos on File</h3>
          <div className="archive-detail-card">
            <p>{procedure.before_image_url ? "Before photo available." : "No before photo."}</p>
            <p>{procedure.after_image_url ? "After photo available." : "No after photo."}</p>
          </div>
        </>
      )}
    </>
  );
}
