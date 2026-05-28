"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

type UsernameContextType = {
  username: string;
  setUsername: (name: string) => void;
};

const UsernameContext = createContext<UsernameContextType | null>(null);

const STORAGE_KEY = "lospibes_username";

export function UsernameProvider({ children }: { children: ReactNode }) {
  const [username, setUsernameState] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setUsernameState(saved);
    }
  }, []);

  const setUsername = (name: string) => {
    setUsernameState(name);
    localStorage.setItem(STORAGE_KEY, name);
  };

  return (
    <UsernameContext.Provider value={{ username, setUsername }}>
      {children}
    </UsernameContext.Provider>
  );
}

export function useUsername(): UsernameContextType {
  const ctx = useContext(UsernameContext);
  if (!ctx) throw new Error("useUsername debe usarse dentro de <UsernameProvider>");
  return ctx;
}
