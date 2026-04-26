import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, FileSignature, Users, FileType, 
  Plus, Search, QrCode
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatBRL } from "@/utils/format";

const TABS = [
  { id: "dashboard", label: "Visão Geral", icon: LayoutDashboard },
  { id: "comerciais", label: "Contratos Comerciais", icon: FileSignature },
  { id: "termos", label: "Termos e Equipe", icon: Users },
  { id: "modelos", label: "Meus Modelos", icon: FileType },
];

export default function ContratosView() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [qrModalOpen, setQrModalOpen] = useState(false);

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-foreground tracking-tight">Gestão de Contratos</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Contratos comerciais, direitos de imagem e contratações de equipe.</p>
        
        <div className="flex gap-2 mt-6 border-b border-zinc-800 pb-px">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-violet-500 text-violet-400"
                  : "border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1">
        {activeTab === "dashboard" && <ContratosDashboard />}
        {activeTab === "comerciais" && <ContratosComerciais />}
        {activeTab === "termos" && <TermosEquipa onOpenQR={() => setQrModalOpen(true)} />}
        {activeTab === "modelos" && <GestorModelos />}
      </div>

      <Dialog open={qrModalOpen} onOpenChange={setQrModalOpen}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 max-w-sm p-6 text-center">
          <DialogHeader>
            <DialogTitle className="text-center font-heading text-xl">Assinatura no Set</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center mt-4">
            <p className="text-sm text-zinc-400 mb-6">Peça ao figurante/freelancer para escanear o QR Code abaixo para assinar o termo digitalmente.</p>
            <div className="w-48 h-48 bg-white rounded-xl p-2 flex items-center justify-center shadow-lg mb-6">
              <QrCode className="w-40 h-40 text-black" />
            </div>
            <p className="text-xs text-zinc-500 mb-6 animate-pulse">Aguardando preenchimento no dispositivo...</p>
            <Button variant="outline" onClick={() => setQrModalOpen(false)} className="w-full border-zinc-700">Cancelar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ContratosDashboard() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-3 gap-4">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
        <p className="text-xs text-zinc-500 mb-1 font-medium uppercase tracking-wider">Contratos Ativos</p>
        <p className="text-2xl font-bold font-heading text-zinc-100">12</p>
      </div>
      <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-5">
        <p className="text-xs text-violet-400/70 mb-1 font-medium uppercase tracking-wider">Aguardando Assinatura</p>
        <p className="text-2xl font-bold font-heading text-violet-400">03</p>
      </div>
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
        <p className="text-xs text-zinc-500 mb-1 font-medium uppercase tracking-wider">Termos de Imagem</p>
        <p className="text-2xl font-bold font-heading text-zinc-100">45</p>
      </div>
    </motion.div>
  );
}

function ContratosComerciais() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <Input placeholder="Buscar contrato..." className="bg-zinc-900 border-zinc-800 w-64 h-9 text-sm" />
          <Button variant="outline" className="h-9 border-zinc-800 text-zinc-400"><Search className="w-4 h-4"/></Button>
        </div>
        <Button className="bg-violet-600 hover:bg-violet-700 h-9"><Plus className="w-4 h-4 mr-2" /> Novo Contrato</Button>
      </div>
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/20 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/50">
              <th className="text-left px-4 py-3 text-zinc-500 font-medium text-xs uppercase">Contrato</th>
              <th className="text-left px-4 py-3 text-zinc-500 font-medium text-xs uppercase">Cliente</th>
              <th className="text-left px-4 py-3 text-zinc-500 font-medium text-xs uppercase">Vínculo</th>
              <th className="text-right px-4 py-3 text-zinc-500 font-medium text-xs uppercase">Valor</th>
              <th className="text-center px-4 py-3 text-zinc-500 font-medium text-xs uppercase">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-zinc-800/60 hover:bg-zinc-800/20 transition-colors">
              <td className="px-4 py-3 font-mono text-zinc-300">CTR-2026-001</td>
              <td className="px-4 py-3 text-zinc-200">Cliente Exemplo S.A.</td>
              <td className="px-4 py-3 text-zinc-500 text-xs italic">Prop. #1002</td>
              <td className="px-4 py-3 text-right text-zinc-300">{formatBRL(15000)}</td>
              <td className="px-4 py-3 text-center">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Assinado</span>
              </td>
              <td className="px-4 py-3 text-right">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-zinc-500"><Search className="w-4 h-4"/></Button>
              </td>
            </tr>
            <tr className="border-b border-zinc-800/60 hover:bg-zinc-800/20 transition-colors">
              <td className="px-4 py-3 font-mono text-zinc-300">CTR-2026-002</td>
              <td className="px-4 py-3 text-zinc-200">Marca XYZ Ltda.</td>
              <td className="px-4 py-3 text-zinc-500 text-xs italic">Prop. #1005</td>
              <td className="px-4 py-3 text-right text-zinc-300">{formatBRL(28500)}</td>
              <td className="px-4 py-3 text-center">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20">Ag. Assinatura</span>
              </td>
              <td className="px-4 py-3 text-right">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-zinc-500"><Search className="w-4 h-4"/></Button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

function TermosEquipa({ onOpenQR }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between mb-4 bg-violet-600/10 p-4 rounded-xl border border-violet-500/20">
        <div>
          <h3 className="text-sm font-semibold text-violet-300">Coleta de Assinatura no Set</h3>
          <p className="text-xs text-zinc-500 mt-0.5">Agilize a cessão de imagem e voz usando o QR Code no seu tablet ou celular.</p>
        </div>
        <Button onClick={onOpenQR} className="bg-violet-600 hover:bg-violet-700 text-white">
          <QrCode className="w-4 h-4 mr-2" /> Gerar QR Code
        </Button>
      </div>
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/20 overflow-hidden text-center py-12">
        <Users className="w-12 h-12 text-zinc-800 mx-auto mb-3" />
        <p className="text-sm text-zinc-500">Nenhum termo assinado recentemente.</p>
      </div>
    </motion.div>
  );
}

function GestorModelos() {
  const models = [
    { title: "Contrato Audiovisual (PJ)", type: "Comercial" },
    { title: "Termo de Imagem e Voz", type: "Produção" },
    { title: "Contrato Freelancer / Job", type: "Equipe" },
  ];
  return (
    <div className="grid grid-cols-3 gap-4">
      {models.map(m => (
        <div key={m.title} className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 cursor-pointer group">
          <div className="flex justify-between items-start mb-3">
            <FileType className="w-8 h-8 text-violet-500" />
            <span className="text-[10px] uppercase font-bold text-zinc-600 group-hover:text-violet-400 transition-colors">{m.type}</span>
          </div>
          <h3 className="text-sm font-semibold text-zinc-200">{m.title}</h3>
          <p className="text-xs text-zinc-500 mt-1">Clique para editar o modelo e variáveis dinâmicas.</p>
        </div>
      ))}
      <button className="border-2 border-dashed border-zinc-800 rounded-xl p-4 flex flex-col items-center justify-center hover:border-zinc-700 hover:bg-zinc-900/20 transition-all text-zinc-600">
        <Plus className="w-6 h-6 mb-1" />
        <span className="text-xs font-medium">Novo Modelo</span>
      </button>
    </div>
  );
}