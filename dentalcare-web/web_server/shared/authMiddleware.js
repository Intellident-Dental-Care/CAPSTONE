import { verifyToken } from "./token.js";
import { supabaseAdmin } from "./supabaseClient.js";

export const requireAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ success: false, message: "Missing token" });
    }

    const decoded = verifyToken(token);

    if (!decoded?.id || !decoded?.role || decoded?.purpose !== "session") {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }

    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

export const requireVerificationToken = (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ success: false, message: "Missing token" });
    }

    const decoded = verifyToken(token);

    if (!decoded?.id || !decoded?.role || decoded?.purpose !== "verify") {
      return res.status(401).json({ success: false, message: "Invalid verification token" });
    }

    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid or expired verification token" });
  }
};

export const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    return next();
  };
};

export const requireSuperAdmin = (req, res, next) => {
  console.log("SUPER ADMIN CHECK START");
  console.log("Token Role:", req.user?.role);
  console.log("Token Admin Type:", req.user?.adminType);

  const isSuperAdminRole = req.user?.role === "super_admin";
  const isSuperAdminType = req.user?.adminType === "super_admin";

  if (req.user && (isSuperAdminRole || isSuperAdminType)) {
    return next();
  }

  console.log("SUPER ADMIN CHECK FAILED");
  return res.status(403).json({ 
    success: false, 
    message: "Forbidden: Super Admin access required" 
  });
};
