import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function BackButton({ to = "/app", label = "Voltar ao Hub" }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 group"
    >
      <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
      <span className="text-sm">{label}</span>
    </Link>
  );

}