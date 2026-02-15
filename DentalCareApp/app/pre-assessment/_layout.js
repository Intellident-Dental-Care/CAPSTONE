import React, { createContext, useContext, useReducer } from "react";
import { Stack } from "expo-router";

const PreAssessmentContext = createContext();

const initialState = {
  answers: {},
  preassessmentId: null,
  description: "",
};

function preAssessmentReducer(state, action) {
  switch (action.type) {
    case "SET_ANSWER":
      return {
        ...state,
        answers: {
          ...state.answers,
          [action.payload.qIndex]: action.payload.answer,
        },
      };
    case "SET_DESCRIPTION":
      return {
        ...state,
        description: action.payload,
      };
    case "INIT_ANSWERS":
      return {
        ...state,
        answers: action.payload,
      };
    case "SET_PREASSESSMENT_ID":
      return {
        ...state,
        preassessmentId: action.payload,
      };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

export function usePreAssessment() {
  const context = useContext(PreAssessmentContext);
  if (!context) {
    throw new Error("usePreAssessment must be used within PreAssessmentProvider");
  }
  return context;
}

export default function PreAssessmentLayout() {
  const [state, dispatch] = useReducer(preAssessmentReducer, initialState);

  return (
    <PreAssessmentContext.Provider value={{ state, dispatch }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="questions" />
        <Stack.Screen name="description" />
      </Stack>
    </PreAssessmentContext.Provider>
  );
}
