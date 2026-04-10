import { supabaseAdmin } from "../../shared/supabaseClient.js";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const normalizeBranchName = (branchStr) => {
  const normalized = String(branchStr || "").trim().toLowerCase();
  
  if (normalized.includes("dasma") || normalized.includes("dasmariñas")) {
    return "Dasmarinas, Cavite";
  }
  if (normalized.includes("gentri") || normalized.includes("general trias")) {
    return "General Trias, Cavite";
  }
  if (normalized.includes("bacoor")) {
    return "Bacoor, Cavite";
  }
  
  return "Unknown Branch";
};

// UPDATED: Now accepts startDate and endDate parameters
export const getSuperAdminDashboard = async (startDate, endDate) => {
  try {
    const currentYear = new Date().getFullYear();
    
    // Set default dates to the current year if none are provided
    const start = startDate || `${currentYear}-01-01`;
    const end = endDate || `${currentYear}-12-31`;

    const [
      { data: admins },
      { data: dentists },
      { count: patientCount },
      { data: bookings },
      { data: services }
    ] = await Promise.all([
      supabaseAdmin.from("admin_list").select("id, branch, created_at"),
      supabaseAdmin.from("dentist_list").select("id, created_at"),
      supabaseAdmin.from("users").select("*", { count: "exact", head: true }),
      // Apply the dynamic date filters here
      supabaseAdmin.from("bookings")
        .select("branch, service, booking_type, status, appointment_date, created_at")
        .gte("appointment_date", start)
        .lte("appointment_date", end),
      supabaseAdmin.from("dental_services").select("id, name, created_at")
    ]);

    const STRICT_BRANCHES = [
      "Dasmarinas, Cavite", 
      "General Trias, Cavite", 
      "Bacoor, Cavite"
    ];
    
    const globalTotalBranches = STRICT_BRANCHES.length;

    const analyticsMap = {
      "All Branches": initBranchData("All Branches", globalTotalBranches, admins?.length || 0, dentists?.length || 0, patientCount || 0)
    };

    STRICT_BRANCHES.forEach(branch => {
      const branchAdmins = (admins || []).filter(a => normalizeBranchName(a.branch) === branch).length;
      analyticsMap[branch] = initBranchData(branch, globalTotalBranches, branchAdmins, dentists?.length || 0, 0); 
    });

    const branchPerfMap = {}; 

    (bookings || []).forEach(b => {
      const branch = normalizeBranchName(b.branch);
      
      if (branch === "Unknown Branch") return; 

      const status = String(b.status).toLowerCase();
      const type = String(b.booking_type).toLowerCase();
      const service = b.service || "Unknown";
      const monthIdx = new Date(b.appointment_date).getMonth();

      updateAnalytics(analyticsMap["All Branches"], status, type, service, monthIdx);
      updateAnalytics(analyticsMap[branch], status, type, service, monthIdx);

      if (!branchPerfMap[branch]) branchPerfMap[branch] = { appointments: 0, patients: 0 };
      branchPerfMap[branch].appointments++;
    });

    analyticsMap["All Branches"].branchPerformance = Object.entries(branchPerfMap).map(([name, stats]) => ({
      name, appointments: stats.appointments, patients: stats.appointments 
    }));

    STRICT_BRANCHES.forEach(branch => {
        if (analyticsMap[branch]) {
            analyticsMap[branch].branchPerformance = [{ 
                name: branch, 
                appointments: branchPerfMap[branch]?.appointments || 0, 
                patients: branchPerfMap[branch]?.appointments || 0 
            }];
        }
    });

    Object.values(analyticsMap).forEach(data => {
        const totalItems = Object.values(data.serviceCounts).reduce((a, b) => a + b, 0);
        data.topServices = Object.entries(data.serviceCounts)
          .map(([label, count]) => ({ label, value: totalItems > 0 ? Math.round((count / totalItems) * 100) : 0, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 4)
          .map(({ label, value }) => ({ label, value }));
        delete data.serviceCounts; 
    });

    const overallBranchTrends = STRICT_BRANCHES.map((branch, idx) => ({
        name: branch,
        values: analyticsMap[branch]?.monthlyAppointments.map(m => m.total) || Array(12).fill(0),
        lineClass: `branch-line-${(idx % 3) + 1}`
    }));

    const activities = [];
    (admins || []).forEach(a => activities.push({ date: new Date(a.created_at), title: "New admin account added", description: `A new admin was assigned to the ${normalizeBranchName(a.branch)} branch.` }));
    (dentists || []).forEach(d => activities.push({ date: new Date(d.created_at), title: "New dentist registered", description: `A new dentist account was created.` }));
    (services || []).forEach(s => activities.push({ date: new Date(s.created_at), title: "Service list updated", description: `Service '${s.name}' was added.` }));
    (bookings || []).forEach(b => activities.push({ date: new Date(b.created_at), title: "New Appointment", description: `A ${b.booking_type} appointment was created for ${normalizeBranchName(b.branch)}.`}));

    activities.sort((a, b) => b.date - a.date);
    
    const recentActivities = activities.slice(0, 4).map((act, id) => {
        const diffMs = Date.now() - act.date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        let timeStr = `${diffMins} mins ago`;
        if (diffDays > 0) timeStr = `${diffDays} days ago`;
        else if (diffHours > 0) timeStr = `${diffHours} hours ago`;

        return { id: id + 1, title: act.title, description: act.description, time: timeStr };
    });

    if (recentActivities.length === 0) {
        recentActivities.push({ id: 1, title: "System Ready", description: "All systems are operational.", time: "Just now" });
    }

    return {
      success: true,
      statusCode: 200,
      data: {
        analyticsData: Object.values(analyticsMap),
        overallBranchTrends,
        recentActivities
      }
    };
  } catch (error) {
    console.error("Dashboard error:", error);
    return { success: false, statusCode: 500, message: "Dashboard error: " + error.message };
  }
};

// Helper Functions
function initBranchData(branch, totalBranches, totalAdmins, totalDentists, totalPatients) {
    return {
        branch,
        totalBranches, 
        totalAdmins,
        totalDentists,
        totalPatients,
        totalAppointments: 0,
        completed: 0,
        cancelled: 0,
        walkins: 0,
        serviceCounts: {},
        branchPerformance: [],
        monthlyAppointments: MONTHS.map(m => ({ month: m, total: 0 }))
    };
}

function updateAnalytics(data, status, type, service, monthIdx) {
    data.totalAppointments++;
    if (status === "completed") data.completed++;
    if (status === "cancelled") data.cancelled++;
    if (type === "walk-in" || type === "walkin") data.walkins++;

    if (!data.serviceCounts[service]) data.serviceCounts[service] = 0;
    data.serviceCounts[service]++;

    if (monthIdx >= 0 && monthIdx < 12) {
        data.monthlyAppointments[monthIdx].total++;
    }
}