import React, { createContext, useContext, useReducer } from "react";
import { Stack } from "expo-router";

const PreAssessmentContext = createContext();

const initial = {
  tooth: "3rd Molar",
  answers: {},       // { [qIndex]: optionText }
  description: "",
  photoUri: "",      // optional
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

    case "SET_DESCRIPTION":
      return { ...state, description: action.payload };
    case "SET_PHOTO":
      return { ...state, photoUri: action.payload };
    case "RESET":
      return initial;
    default:
      return state;
  }
}

export function usePreAssessment() {
  const v = useContext(Ctx);
  if (!v) throw new Error("usePreAssessment must be used inside PreAssessmentLayout");
  return v;
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