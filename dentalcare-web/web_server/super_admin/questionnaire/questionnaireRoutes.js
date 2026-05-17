// web_server/super_admin/questionnaire/questionnaireRoutes.js

import express from "express";

import {
  getQuestions,
  addQuestion,
  updateQuestion,
  deleteQuestion,
} from "./questionnaireService.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const questions = await getQuestions();

    res.status(200).json(questions);
  } catch (error) {
    console.error("Fetch questionnaire error:", error);
    res.status(500).json({ message: "Failed to fetch questions." });
  }
});

router.post("/", async (req, res) => {
  try {
    const { question_text, options, question_order } = req.body;

    if (!question_text || !options || options.length === 0) {
      return res.status(400).json({
        message: "Question and options are required.",
      });
    }

    const newQuestion = await addQuestion({
      question_text,
      options,
      question_order,
      is_active: true,
    });

    res.status(201).json(newQuestion);
  } catch (error) {
    console.error("Add questionnaire error:", error);
    res.status(500).json({ message: "Failed to add question." });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { question_text, options } = req.body;

    const updatedQuestion = await updateQuestion(id, {
      question_text,
      options,
      updated_at: new Date().toISOString(),
    });

    res.status(200).json(updatedQuestion);
  } catch (error) {
    console.error("Update questionnaire error:", error);
    res.status(500).json({ message: "Failed to update question." });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await deleteQuestion(id);

    res.status(200).json({ message: "Question deleted successfully." });
  } catch (error) {
    console.error("Delete questionnaire error:", error);
    res.status(500).json({ message: "Failed to delete question." });
  }
});

export default router;