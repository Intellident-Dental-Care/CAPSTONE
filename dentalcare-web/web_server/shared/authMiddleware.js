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

export const requireSuperAdmin = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const { data: admin, error } = await supabaseAdmin
      .from("admin_list")
      .select("admin_type, is_active")
      .eq("id", req.user.id)
      .single();

    if (error || !admin || !admin.is_active || admin.admin_type !== "super_admin") {
      return res.status(403).json({ success: false, message: "Super admin only" });
    }

    return next();
  } catch (error) {
    return res.status(500).json({ success: false, message: "Authorization check failed" });
  }
};
