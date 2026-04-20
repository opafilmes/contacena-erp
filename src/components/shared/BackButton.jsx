import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function BackButton({ to, label = "Voltar", fallback = "/login" }) {
  const navigate = useNavigate();

  const handleBack = (e) => {
    e.preventDefault();
    
    // Se 'to' foi fornecido, navega para lá
    if (to) {
      navigate(to);
    } else {
      // Caso contrário, tenta voltar no histórico
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        // Se não há histórico, vai para o fallback (dashboard)
        navigate(fallback);
      }
    }
  };

  return (
    <button
      onClick={handleBack}
      className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 group">
      <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
      <span className="text-sm">{label}</span>
    </button>
  );
}