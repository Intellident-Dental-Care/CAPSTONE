import express from "express";
import { requireAuth, requireRole } from "../../shared/authMiddleware.js";
import { 
  getServicesList, 
  createService,
  getServiceCategories,
  createServiceCategory,
  updateServiceCategory,
  updateServiceCategoryStatus
} from "./servicesService.js";

const router = express.Router();

const requireSuperAdmin = (req, res, next) => {
  if (req.user?.adminType === "super_admin" || req.user?.admin_type === "super_admin") return next();
  return res.status(403).json({ success: false, message: "Forbidden: Super Admin only" });
};

// --- SERVICES ---
router.get("/", requireAuth, requireRole("admin"), requireSuperAdmin, async (req, res) => {
  const result = await getServicesList();
  return res.status(result.statusCode || 500).json(result);
});

router.post("/", requireAuth, requireRole("admin"), requireSuperAdmin, async (req, res) => {
  const result = await createService(req.body);
  return res.status(result.statusCode || 500).json(result);
});

// --- CATEGORIES ---
router.get("/categories", requireAuth, requireRole("admin"), requireSuperAdmin, async (req, res) => {
  const result = await getServiceCategories();
  return res.status(result.statusCode || 500).json(result);
});

router.post("/categories", requireAuth, requireRole("admin"), requireSuperAdmin, async (req, res) => {
  const result = await createServiceCategory(req.body);
  return res.status(result.statusCode || 500).json(result);
});

router.put("/categories/:id", requireAuth, requireRole("admin"), requireSuperAdmin, async (req, res) => {
  const result = await updateServiceCategory(req.params.id, req.body);
  return res.status(result.statusCode || 500).json(result);
});

router.patch("/categories/status", requireAuth, requireRole("admin"), requireSuperAdmin, async (req, res) => {
  const { ids, status } = req.body;
  if (!ids || !status) return res.status(400).json({ success: false, message: "Missing ids or status" });
  const result = await updateServiceCategoryStatus(ids, status);
  return res.status(result.statusCode || 500).json(result);
});

export default router;