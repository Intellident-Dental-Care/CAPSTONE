import { createContext, useContext, useEffect, useState } from "react";

const BranchContext = createContext();

const DEFAULT_BRANCH = "Dasmarinas, Cavite";

export function BranchProvider({ children }) {
  const [selectedBranch, setSelectedBranch] = useState(() => {
    return localStorage.getItem("selectedBranch") || DEFAULT_BRANCH;
  });

  useEffect(() => {
    localStorage.setItem("selectedBranch", selectedBranch);
  }, [selectedBranch]);

  return (
    <BranchContext.Provider
      value={{
        selectedBranch,
        setSelectedBranch,
      }}
    >
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch() {
  const context = useContext(BranchContext);

  if (!context) {
    throw new Error("useBranch must be used inside BranchProvider");
  }

  return context;
}