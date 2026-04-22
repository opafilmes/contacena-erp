import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function BackButton({ to = "/", label = "Voltar ao Hub" }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 group">
      
      
      <span className="text-sm">{label}</span>
    </Link>);

}