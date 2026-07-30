import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import path from "path";

import authRoutes from "./authentication/routes.js";

import dashboardRoutes from "./admin/dashboard/dashboardRoutes.js";
import queueRoutes from "./admin/queuecontrol/queueRoutes.js";
import profileRoutes from "./admin/profile/profileRoutes.js";
import appointmentsRoutes from "./admin/appointments/appointmentsRoutes.js";
import dentistsRoutes from "./admin/dentists/dentistsRoutes.js";
import patientsRoutes from "./admin/patients/patientsRoutes.js";
import notificationRoutes from "./admin/notifications/notificationRoutes.js";

import dentistDashboardRoutes from "./dentist/dashboard/dashboardRoutes.js";
import dentistScheduleRoutes from "./dentist/schedule/scheduleRoutes.js";
import dentistProfileRoutes from "./dentist/profile/profileRoutes.js";
import dentistPatientsRoutes from "./dentist/patients/patientsRoutes.js";
import dentistNotificationRoutes from "./dentist/notification/notificationRoutes.js";

import superAdminDashboardRoutes from "./super_admin/dashboard/dashboardRoutes.js";
import superAdminAdminsRoutes from "./super_admin/admins/adminsRoutes.js";
import superAdminDentistsRoutes from "./super_admin/dentists/dentistsRoutes.js";
import superAdminPatientsRoutes from "./super_admin/patients/patientsRoutes.js";
import superAdminServicesRoutes from "./super_admin/services/servicesRoutes.js";
import superAdminFaqsRoutes from "./super_admin/faqs/faqsRoutes.js";
import superAdminTermsRoutes from "./super_admin/terms/termsRoutes.js";
import questionnaireRoutes from "./super_admin/questionnaire/questionnaireRoutes.js";

import {
  getLocalIpAddress,
  getServerDiscoveryUrls,
} from "./shared/getServerUrl.js";

import { verifyEmailTransport } from "./nodemailer/emailOtpService.js";

dotenv.config({
  path: path.resolve(process.cwd(), ".env"),
});

dotenv.config({
  path: path.resolve(process.cwd(), "../.env"),
  override: false,
});

const app = express();

const PORT = Number(
  process.env.PORT ||
  process.env.EMAIL_SERVER_PORT ||
  5001
);

const LOCAL_IP = getLocalIpAddress();

/*
  Using credentials: true together with origin: "*"
  can cause CORS issues.

  origin: true allows the requesting origin while still
  supporting credentials.
*/
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json({ limit: "15mb" }));

// Root route
app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "CAPSTONE API is running",
  });
});

// Health check
app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

// Server discovery
app.get("/server-discovery", (_req, res) => {
  const currentUrl =
    process.env.RENDER_EXTERNAL_URL ||
    `http://${LOCAL_IP}:${PORT}`;

  res.status(200).json({
    success: true,
    serverInfo: {
      currentIP: LOCAL_IP,
      currentUrl,
      urls: getServerDiscoveryUrls(PORT).urls,
    },
  });
});

/* =====================================================
   AUTHENTICATION ROUTES
===================================================== */

app.use("/api/auth", authRoutes);

// Keep old authentication endpoints working
app.use("/", authRoutes);

/* =====================================================
   ADMIN ROUTES WITH /api PREFIX
===================================================== */

app.use("/api/admin/dashboard", dashboardRoutes);
app.use("/api/admin/queuecontrol", queueRoutes);
app.use("/api/admin/profile", profileRoutes);
app.use("/api/admin/appointments", appointmentsRoutes);
app.use("/api/admin/dentists", dentistsRoutes);
app.use("/api/admin/patients", patientsRoutes);
app.use("/api/admin/notifications", notificationRoutes);

/* =====================================================
   ADMIN ROUTES WITHOUT /api PREFIX

   Your current frontend uses:
   /admin/dentists
   /admin/profile
   /admin/appointments
   and similar URLs.
===================================================== */

app.use("/admin/dashboard", dashboardRoutes);
app.use("/admin/queuecontrol", queueRoutes);
app.use("/admin/profile", profileRoutes);
app.use("/admin/appointments", appointmentsRoutes);
app.use("/admin/dentists", dentistsRoutes);
app.use("/admin/patients", patientsRoutes);
app.use("/admin/notifications", notificationRoutes);

/* =====================================================
   DENTIST ROUTES WITH /api PREFIX
===================================================== */

app.use("/api/dentist/dashboard", dentistDashboardRoutes);
app.use("/api/dentist/schedule", dentistScheduleRoutes);
app.use("/api/dentist/profile", dentistProfileRoutes);
app.use("/api/dentist/patients", dentistPatientsRoutes);
app.use("/api/dentist/notifications", dentistNotificationRoutes);

/* =====================================================
   DENTIST ROUTES WITHOUT /api PREFIX
===================================================== */

app.use("/dentist/dashboard", dentistDashboardRoutes);
app.use("/dentist/schedule", dentistScheduleRoutes);
app.use("/dentist/profile", dentistProfileRoutes);
app.use("/dentist/patients", dentistPatientsRoutes);
app.use("/dentist/notifications", dentistNotificationRoutes);

/* =====================================================
   SUPER ADMIN ROUTES WITH /api PREFIX
===================================================== */

app.use(
  "/api/super_admin/dashboard",
  superAdminDashboardRoutes
);

app.use(
  "/api/super_admin/admins",
  superAdminAdminsRoutes
);

app.use(
  "/api/super_admin/dentists",
  superAdminDentistsRoutes
);

app.use(
  "/api/super_admin/patients",
  superAdminPatientsRoutes
);

app.use(
  "/api/super_admin/services",
  superAdminServicesRoutes
);

app.use(
  "/api/super_admin/faqs",
  superAdminFaqsRoutes
);

app.use(
  "/api/super_admin/terms",
  superAdminTermsRoutes
);

app.use(
  "/api/super_admin/questionnaire",
  questionnaireRoutes
);

/* =====================================================
   SUPER ADMIN ROUTES WITHOUT /api PREFIX
===================================================== */

app.use(
  "/super_admin/dashboard",
  superAdminDashboardRoutes
);

app.use(
  "/super_admin/admins",
  superAdminAdminsRoutes
);

app.use(
  "/super_admin/dentists",
  superAdminDentistsRoutes
);

app.use(
  "/super_admin/patients",
  superAdminPatientsRoutes
);

app.use(
  "/super_admin/services",
  superAdminServicesRoutes
);

app.use(
  "/super_admin/faqs",
  superAdminFaqsRoutes
);

app.use(
  "/super_admin/terms",
  superAdminTermsRoutes
);

app.use(
  "/super_admin/questionnaire",
  questionnaireRoutes
);

/* =====================================================
   404 HANDLER
===================================================== */

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

/* =====================================================
   GLOBAL ERROR HANDLER
===================================================== */

app.use((err, _req, res, _next) => {
  console.error("Unhandled server error:", err);

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

/* =====================================================
   START SERVER
===================================================== */

app.listen(PORT, "0.0.0.0", async () => {
  console.log(`Web server running on port ${PORT}`);
  console.log(`Local URL: http://${LOCAL_IP}:${PORT}`);
  console.log(`Health: http://${LOCAL_IP}:${PORT}/health`);

  console.log(
    `Admin dentists endpoint: http://${LOCAL_IP}:${PORT}/admin/dentists`
  );

  console.log(
    `Admin dentists API endpoint: http://${LOCAL_IP}:${PORT}/api/admin/dentists`
  );

  try {
    await verifyEmailTransport();
    console.log("Email transporter verified successfully");
  } catch (error) {
    console.error(
      "Email transporter verification failed:",
      error?.message || error
    );
  }
});