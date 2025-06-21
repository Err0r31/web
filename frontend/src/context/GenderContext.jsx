import React, { createContext, useContext, useState } from "react";

const GenderContext = createContext();

export function useGender() {
  return useContext(GenderContext);
}

export function GenderProvider({ children }) {
  const [gender, setGender] = useState("male");
  return (
    <GenderContext.Provider value={{ gender, setGender }}>
      {children}
    </GenderContext.Provider>
  );
}