// web_server/super_admin/questionnaire/questionnaireService.js

import { supabaseAdmin } from "../../shared/supabaseClient.js";

export const getQuestions = async () => {
  const { data, error } = await supabaseAdmin
    .from("questionnaire")
    .select("*")
    .eq("is_active", true)
    .order("question_order", { ascending: true });

  if (error) throw error;

  return data;
};

export const addQuestion = async (questionData) => {
  const { data, error } = await supabaseAdmin
    .from("questionnaire")
    .insert([questionData])
    .select();

  if (error) throw error;

  return data;
};

export const updateQuestion = async (id, questionData) => {
  const { data, error } = await supabaseAdmin
    .from("questionnaire")
    .update(questionData)
    .eq("id", id)
    .select();

  if (error) throw error;

  return data;
};

export const deleteQuestion = async (id) => {
  const { error } = await supabaseAdmin
    .from("questionnaire")
    .delete()
    .eq("id", id);

  if (error) throw error;

  return true;
};