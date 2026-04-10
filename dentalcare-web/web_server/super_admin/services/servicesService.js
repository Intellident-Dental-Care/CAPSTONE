import { supabaseAdmin } from "../../shared/supabaseClient.js";

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

// ADD THIS FUNCTION
export const createService = async (payload) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("dental_services")
      .insert([
        {
          name: payload.name,
          category: payload.category,
          notes: payload.description,
          is_active: true,
          display_order: 999, // New items at the end
          price_display: "Starts at ₱0" // Default placeholder
        },
      ])
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
      },
    };
  } catch (error) {
    return { success: false, statusCode: 500, message: error.message };
  }
};