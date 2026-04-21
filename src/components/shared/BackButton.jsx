import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function BackButton({ to = "/", label = "Voltar ao Hub" }) {
  const navigate = useNavigate();

  // Função "Cata-Fantasma": Limpa qualquer trava de tela do shadcn/Radix
  const clearLocks = () => {
    document.body.style.pointerEvents = "";
    document.body.style.overflow = "";
    document.body.removeAttribute("data-scroll-locked");
  };

  // Prevenção 1: Se o usuário usar a seta "Voltar" do próprio navegador (Chrome/Safari)
  useEffect(() => {
    return () => {
      clearLocks();
    };
  }, []);

  // Prevenção 2: Se o usuário clicar no nosso BackButton
  const handleBack = (e) => {
    e.preventDefault();
    clearLocks(); // Limpa as telas escuras
    navigate(to); // Navega com segurança
  };

  return (
    <button
      onClick={handleBack}
      className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 group"
    >
      <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}