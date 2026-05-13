import React, { createContext, useContext, useReducer } from "react";
import { Stack } from "expo-router";

const PreAssessmentContext = createContext();

const initial = {
  tooth: "Not specified",
  answers: {},
  description: "",
  photoUri: "",
  preassessmentId: null,
  suggestedService: "",
};

function preAssessmentReducer(state, action) {
  switch (action.type) {
    case "SET_TOOTH":
      return { ...state, tooth: action.payload };

    case "SET_ANSWER":
      return {
        ...state,
        answers: {
          ...state.answers,
          [action.payload.qIndex]: action.payload.answer,
        },
      };

    case "INIT_ANSWERS":
      return { ...state, answers: {} };

    case "SET_DESCRIPTION":
      return { ...state, description: action.payload };

    case "SET_PHOTO":
      return { ...state, photoUri: action.payload };

    case "SET_PREASSESSMENT_ID":
      return { ...state, preassessmentId: action.payload };

    case "SET_SUGGESTED_SERVICE":
      return { ...state, suggestedService: action.payload };

    case "RESET":
      return initial;

    default:
      return state;
  }
}

export function usePreAssessment() {
  const v = useContext(PreAssessmentContext);
  if (!v) {
    throw new Error("usePreAssessment must be used inside PreAssessmentLayout");
  }
  return v;
}

export default function PreAssessmentLayout() {
  const [state, dispatch] = useReducer(preAssessmentReducer, initial);

  return (
    <PreAssessmentContext.Provider value={{ state, dispatch }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="model" />
        <Stack.Screen name="photo" />
        <Stack.Screen name="questions" />
        <Stack.Screen name="description" />
        <Stack.Screen name="confirmation" />
        <Stack.Screen name="ai-summary" />
      </Stack>
    </PreAssessmentContext.Provider>
  );
}