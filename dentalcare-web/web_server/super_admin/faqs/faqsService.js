import { supabaseAdmin } from "../../shared/supabaseClient.js";

export const getFaqsList = async () => {
  try {
    // Order by created_at descending so new FAQs appear at the top
    const { data, error } = await supabaseAdmin.from("faqs").select("*").order("created_at", { ascending: false });
    if (error) throw error;

    return { success: true, statusCode: 200, data: data };
  } catch (error) {
    return { success: false, statusCode: 500, message: error.message };
  }
};

// ADD THIS NEW FUNCTION
export const createFaq = async (faqData) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("faqs")
      .insert([
        {
          question: faqData.question,
          answer: faqData.answer,
          category: faqData.category,
          is_active: true
        }
      ])
      .select("*")
      .single();

    if (error) throw error;

    return { success: true, statusCode: 201, data: data };
  } catch (error) {
    console.error("Error creating FAQ:", error);
    return { success: false, statusCode: 500, message: error.message };
  }
};