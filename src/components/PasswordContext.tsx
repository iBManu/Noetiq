import React, { createContext, useContext, useState } from "react";

interface PasswordContextType {
  password: string;
  setPassword: (pwd: string) => void;
}

const PasswordContext = createContext<PasswordContextType | undefined>(undefined);

export const PasswordProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [password, setPassword] = useState("");

  return (
    <PasswordContext.Provider value={{ password, setPassword }}>
      {children}
    </PasswordContext.Provider>
  );
};

export const usePassword = (): PasswordContextType => {
  const context = useContext(PasswordContext);
  if (!context) {
    throw new Error("usePassword must be used within a PasswordProvider");
  }
  return context;
};
