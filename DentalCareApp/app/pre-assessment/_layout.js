import React, { createContext, useContext, useMemo, useReducer } from "react";
import { Stack } from "expo-router";

const Ctx = createContext(null);

const initial = {
  tooth: "3rd Molar",
  answers: {},
  description: "",
  photoUri: "",
  suggestedService: "",
};

function reducer(state, action) {
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

    case "SET_SUGGESTED_SERVICE":
      return { ...state, suggestedService: action.payload };

    case "RESET":
      return initial;

    default:
      return state;
  }
}

export function usePreAssessment() {
  const v = useContext(Ctx);
  if (!v) {
    throw new Error("usePreAssessment must be used inside PreAssessmentLayout");
  }
  return v;
}

export default function PreAssessmentLayout() {
  const [state, dispatch] = useReducer(reducer, initial);

  const value = useMemo(() => ({ state, dispatch }), [state]);

  return (
    <Ctx.Provider value={value}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="model" />
        <Stack.Screen name="questions" />
        <Stack.Screen name="description" />
        <Stack.Screen name="photo" />
        <Stack.Screen name="ai-summary" />
        <Stack.Screen name="book-now" />
      </Stack>
    </Ctx.Provider>
  );
}