import React, { useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";

export default function MeuPerfil() {
  const { usuario } = useOutletContext();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nome: usuario?.nome || "",
    foto_perfil: usuario?.foto_perfil || "",
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!usuario?.id) return;
    await base44.entities.Usuarios.update(usuario.id, form);
    toast.success("Perfil atualizado com sucesso!");
    setSaving(false);
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <button
        onClick={() => navigate("/")}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">Voltar ao Hub</span>
      </button>

      <h1 className="font-heading text-2xl font-bold text-foreground mb-8">
        Meu Perfil
      </h1>

      <div className="space-y-6 bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6">
        <div className="space-y-2">
          <Label>Nome</Label>
          <Input
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            placeholder="Seu nome completo"
          />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input
            value={usuario?.email || ""}
            disabled
            className="opacity-60"
          />
        </div>
        <div className="space-y-2">
          <Label>Papel</Label>
          <Input
            value={usuario?.role || ""}
            disabled
            className="opacity-60"
          />
        </div>
        <div className="space-y-2">
          <Label>URL da Foto de Perfil</Label>
          <Input
            value={form.foto_perfil}
            onChange={(e) => setForm({ ...form, foto_perfil: e.target.value })}
            placeholder="https://..."
          />
        </div>
        <Button onClick={handleSave} disabled={saving} className="w-full">
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Salvando..." : "Salvar Perfil"}
        </Button>
      </div>
    </div>
  );
}