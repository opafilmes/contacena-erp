import React, { useState, useRef } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, Upload, Loader2, Camera } from "lucide-react";
import { toast } from "sonner";

export default function MeuPerfil() {
  const { usuario } = useOutletContext();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    nome: usuario?.nome || "",
    foto_perfil: usuario?.foto_perfil || ""
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm((f) => ({ ...f, foto_perfil: file_url }));
    setUploading(false);
    toast.success("Foto enviada!");
  };

  const handleSave = async () => {
    // 1. Tenta encontrar o ID do usuário em todas as nomenclaturas possíveis
    const userId = usuario?.id || usuario?._id || usuario?.uid;

    // Se realmente não achar, ele avisa, mas agora imprime no console para podermos investigar
    if (!userId) {
      console.log("🚨 ERRO - Dados do usuário carregados:", usuario);
      toast.error("Erro de identificação. Verifique o console (F12).");
      return;
    }

    setSaving(true);
    
    try {
      // 2. Salva no banco de dados usando o ID que encontramos
      await base44.entities.Usuarios.update(userId, { 
        nome: form.nome, 
        foto_perfil: form.foto_perfil 
      });
      
      // 3. Dispara o aviso verde
      toast.success("Perfil atualizado com sucesso!");
      
      // 4. Aguarda 1,5 segundos e recarrega a página para o nome novo subir para o cabeçalho
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      
    } catch (error) {
      toast.error("Erro ao atualizar o perfil. Tente novamente.");
      console.error("Erro no update:", error);
    } finally {
      setSaving(false);
    }
  };

  const initials = usuario?.nome ?
  usuario.nome.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() :
  "U";

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <button onClick={() => navigate("/")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8">
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">Voltar ao Hub</span>
      </button>

      <h1 className="font-heading text-2xl font-bold text-foreground mb-8">Meu Perfil</h1>

      <div className="space-y-6 bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6">
        {/* Avatar upload */}
        <div className="flex flex-col items-center gap-3 pb-4 border-b border-border/30">
          <div className="relative">
            {form.foto_perfil ?
            <img
              src={form.foto_perfil}
              alt="Foto de perfil"
              className="w-24 h-24 rounded-full object-cover border-2 border-primary/30" /> :


            <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center text-primary font-heading font-bold text-2xl border-2 border-primary/30">
                {initials}
              </div>
            }
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white shadow-lg hover:bg-accent/90 transition-colors">
              
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
          <p className="text-xs text-muted-foreground">Clique no ícone para alterar.

          </p>
        </div>

        <div className="space-y-2">
          <Label>Nome</Label>
          <Input value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} placeholder="Seu nome completo" />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input value={usuario?.email || ""} disabled className="opacity-60" />
        </div>
        <div className="space-y-2">
          <Label>Papel</Label>
          <Input value={usuario?.role || ""} disabled className="opacity-60" />
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Salvando..." : "Salvar Perfil"}
        </Button>
      </div>
    </div>);

}