import { supabaseAdmin } from "../../shared/supabaseClient.js";

export const getTermsDetails = async () => {
  const { data, error } = await supabaseAdmin
    .from("Terms")
    .select("id, title, description, created_at, updated_at")
    .order("id", { ascending: true });

  if (error) {
    return { success: false, statusCode: 500, message: "Failed to fetch terms" };
  }

  // Map 'description' from DB to 'content' for the frontend
  const formattedData = data.map(item => ({
    id: item.id,
    title: item.title,
    content: item.description
  }));

  return { success: true, statusCode: 200, data: formattedData };
};

export const saveTermsDetails = async (termsList, userId) => {
  try {
    // Delete existing terms to cleanly sync with the frontend's arranged list
    await supabaseAdmin.from("Terms").delete().neq("id", 0);

    // Prepare the new list to insert
    const timestamp = new Date().toISOString();
    const insertPayload = termsList.map((term, index) => ({
      id: index + 1, // Cleanly re-index IDs starting from 1
      title: term.title,
      description: term.content, // Map frontend 'content' back to DB 'description'
      created_at: timestamp,
      updated_at: timestamp,
      created_by: userId,
      updated_by: userId
    }));

    // Insert the updated list
    if (insertPayload.length > 0) {
      const { error } = await supabaseAdmin.from("Terms").insert(insertPayload);
      if (error) throw error;
    }

    return { success: true, statusCode: 200, message: "Terms saved successfully" };
  } catch (error) {
    console.error("Terms save error:", error);
    return { success: false, statusCode: 500, message: "Failed to save terms" };
  }
};