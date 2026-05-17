import { supabaseAdmin } from "../../shared/supabaseClient.js";

// --- SERVICES ---
export const getServicesList = async () => {
  try {
    const { data, error } = await supabaseAdmin.from("dental_services").select("*").order("display_order", { ascending: true });
    if (error) throw error;

    const mapped = data.map(service => ({
      id: service.id,
      name: service.name,
      category: service.category,
      description: service.notes || "No description provided.",
      status: service.is_active ? "Active" : "Disabled",
      price_display: service.price_display
    }));

    return { success: true, statusCode: 200, data: mapped };
  } catch (error) {
    return { success: false, statusCode: 500, message: error.message };
  }
};

export const createService = async (payload) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("dental_services")
      .insert([{
        name: payload.name,
        category: payload.category,
        notes: payload.description,
        is_active: true,
        display_order: 999, 
        price_display: payload.price_display || "Starts at ₱0"
      }])
      .select();

    if (error) throw error;

    const newRecord = data[0];
    return {
      success: true,
      statusCode: 201,
      data: {
        id: newRecord.id,
        name: newRecord.name,
        category: newRecord.category,
        description: newRecord.notes,
        status: "Active",
        price_display: newRecord.price_display
      },
    };
  } catch (error) {
    return { success: false, statusCode: 500, message: error.message };
  }
};

// --- CATEGORIES ---
export const getServiceCategories = async () => {
  try {
    const { data, error } = await supabaseAdmin.from("service_category").select("*").order("category_name", { ascending: true });
    if (error) throw error;
    return { success: true, statusCode: 200, data };
  } catch (error) {
    return { success: false, statusCode: 500, message: error.message };
  }
};

export const createServiceCategory = async (payload) => {
  try {
    const { data, error } = await supabaseAdmin.from("service_category").insert([{ category_name: payload.category_name }]).select();
    if (error) throw error;
    return { success: true, statusCode: 201, data: data[0] };
  } catch (error) {
    return { success: false, statusCode: 500, message: error.message };
  }
};

export const updateServiceCategory = async (id, payload) => {
  try {
    const { data, error } = await supabaseAdmin.from("service_category").update({ category_name: payload.category_name, updated_at: new Date().toISOString() }).eq("id", id).select();
    if (error) throw error;
    return { success: true, statusCode: 200, data: data[0] };
  } catch (error) {
    return { success: false, statusCode: 500, message: error.message };
  }
};

export const updateServiceCategoryStatus = async (ids, status) => {
  try {
    const { data, error } = await supabaseAdmin.from("service_category").update({ status, updated_at: new Date().toISOString() }).in("id", ids).select();
    if (error) throw error;
    return { success: true, statusCode: 200, data };
  } catch (error) {
    return { success: false, statusCode: 500, message: error.message };
  }
};