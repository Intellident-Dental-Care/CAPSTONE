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
import dentistDashboardRoutes from "./dentist/dashboard/dashboardRoutes.js";
import dentistScheduleRoutes from "./dentist/schedule/scheduleRoutes.js";
import dentistProfileRoutes from "./dentist/profile/profileRoutes.js";
import dentistPatientsRoutes from "./dentist/patients/patientsRoutes.js";
import { getLocalIpAddress, getServerDiscoveryUrls } from "./shared/getServerUrl.js";
import { verifyEmailTransport } from "./nodemailer/emailOtpService.js";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), "../.env"), override: false });

const app = express();
const PORT = Number(process.env.EMAIL_SERVER_PORT || 5001);
const LOCAL_IP = getLocalIpAddress();

app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ success: true, status: "healthy", timestamp: new Date().toISOString() });
});

app.get("/server-discovery", (_req, res) => {
  res.status(200).json({
    success: true,
    serverInfo: {
      currentIP: LOCAL_IP,
      currentUrl: `http://${LOCAL_IP}:${PORT}`,
      urls: getServerDiscoveryUrls(PORT).urls,
    },
  });
});

app.use("/api/auth", authRoutes);
app.use("/", authRoutes);
app.use("/api/admin/dashboard", dashboardRoutes);
app.use("/api/admin/queuecontrol", queueRoutes);
app.use("/api/admin/profile", profileRoutes);
app.use("/api/admin/appointments", appointmentsRoutes);
app.use("/api/admin/dentists", dentistsRoutes);
app.use("/api/admin/patients", patientsRoutes);
app.use("/api/dentist/dashboard", dentistDashboardRoutes);
app.use("/api/dentist/schedule", dentistScheduleRoutes);
app.use("/api/dentist/profile", dentistProfileRoutes);
app.use("/api/dentist/patients", dentistPatientsRoutes);

app.use((err, _req, res, _next) => {
  console.error("Unhandled server error:", err);
  res.status(500).json({ success: false, message: "Internal server error" });
});

app.listen(PORT, "0.0.0.0", async () => {
  try {
    await verifyEmailTransport();
    console.log("Email transporter verified successfully");
  } catch (error) {
    console.error("Email transporter verification failed:", error?.message || error);
  }

  console.log(`Web server running on: http://${LOCAL_IP}:${PORT}`);
  console.log(`Health: http://${LOCAL_IP}:${PORT}/health`);
});
