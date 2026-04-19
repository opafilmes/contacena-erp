import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function EnviarEmailModal({ proposal, client, tenant, onClose }) {
  const propNum = proposal?.numero_proposta
    ? `PROP-${proposal.numero_proposta}`
    : `PROP-${proposal?.id?.slice(-4).toUpperCase()}`;

  const nomeEmpresa = tenant?.razao_social || tenant?.nome_fantasia || "nossa empresa";
  const emailCliente = client?.contato?.includes("@") ? client.contato : "";

  const [para, setPara] = useState(emailCliente);
  const [assunto, setAssunto] = useState(`Proposta Comercial ${nomeEmpresa} - ${propNum}`);
  const [corpo, setCorpo] = useState(
    `Olá${client?.nome_fantasia ? `, ${client.nome_fantasia}` : ""}!\n\nTemos o prazer de encaminhar nossa proposta comercial ${propNum} para sua apreciação.\n\nEste documento contém todos os detalhes dos serviços propostos, valores e condições. Estamos à disposição para esclarecer qualquer dúvida ou realizar ajustes que atendam melhor às suas necessidades.\n\nAguardamos seu retorno!\n\nAtenciosamente,\n${nomeEmpresa}`
  );
  const [sending, setSending] = useState(false);

  const handleEnviar = async () => {
    if (!para) {
      toast.error("Informe o e-mail do destinatário.");
      return;
    }
    setSending(true);
    await base44.integrations.Core.SendEmail({
      to: para,
      subject: assunto,
      body: corpo.replace(/\n/g, "<br>"),
    });
    toast.success(`E-mail enviado para ${para}!`);
    setSending(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-card border border-border/50 rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-heading font-bold text-lg">✉️ Enviar por E-mail</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{propNum}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-1.5">
          <Label>Para</Label>
          <Input
            type="email"
            placeholder="email@cliente.com"
            value={para}
            onChange={e => setPara(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Assunto</Label>
          <Input value={assunto} onChange={e => setAssunto(e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <Label>Mensagem</Label>
          <textarea
            value={corpo}
            onChange={e => setCorpo(e.target.value)}
            rows={8}
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
          />
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button onClick={handleEnviar} disabled={sending} className="flex-1 gap-2">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {sending ? "Enviando..." : "Enviar E-mail"}
          </Button>
        </div>
      </div>
    </div>
  );
}