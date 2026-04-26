import React, { createContext, useContext, useState, useEffect } from "react";

const AppModeContext = createContext();

export function AppModeProvider({ children, usuario }) {
  const isEquipe = usuario?.role === "Producao";
  const [appMode, setAppMode] = useState(isEquipe ? "studio" : "business");

  useEffect(() => {
    if (isEquipe) setAppMode("studio");
  }, [isEquipe]);

  const toggleMode = () => {
    if (isEquipe) return; // Equipe fica bloqueada no studio
    setAppMode(m => m === "business" ? "studio" : "business");
  };

  return (
    <AppModeContext.Provider value={{ appMode, setAppMode, toggleMode, isEquipe }}>
      {children}
    </AppModeContext.Provider>
  );
}

export const useAppMode = () => useContext(AppModeContext);