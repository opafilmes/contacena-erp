import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, MoreVertical, Pencil, Trash2, Link2, MessageCircle, AlertTriangle, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import CallSheetForm from "./CallSheetForm";

const SCENE_STATUS_COLOR = {
  "Pendente": "text-zinc-400 bg-zinc-800",
  "Em Gravação": "text-sky-400 bg-sky-500/10 border-sky-500/20",
  "Concluída": "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  "Adiada": "text-red-400 bg-red-500/10 border-red-500/20",
};

export default function CallSheetView({ tenantId, clients }) {
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    const data = await base44.entities.CallSheet.filter({ tenant_id: tenantId }, "-date");
    setSheets(data);
    setLoading(false);
  }, [tenantId]);

  useEffect(() => { load(); }, [load]);

  const handleNew = () => { setEditing(null); setFormOpen(true); };
  const handleEdit = (s) => { setEditing(s); setFormOpen(true); };

  const handleGenerateLink = (sheet) => {
    const token = sheet.magic_link_token;
    if (!token) { toast.error("Token não gerado ainda. Salve novamente a Ordem do Dia."); return; }
    const url = `${window.location.origin}/call-sheet/${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copiado para a área de transferência!");
  };

  const handleWhatsapp = (sheet) => {
    const token = sheet.magic_link_token;
    const url = `${window.location.origin}/call-sheet/${token}`;
    const msg = `📋 *Ordem do Dia — ${sheet.project_name}*\n📅 ${sheet.date ? new Date(sheet.date + "T00:00:00").toLocaleDateString("pt-BR") : "—"}\n📍 ${sheet.location_address || ""}\n\nAcesse aqui: ${url}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setIsDeleting(true);
    try {
      const [scenes, crew, checklist] = await Promise.all([
        base44.entities.CallSheetScene.filter({ call_sheet_id: toDelete.id }),
        base44.entities.CallSheetCrew.filter({ call_sheet_id: toDelete.id }),
        base44.entities.CallSheetChecklist.filter({ call_sheet_id: toDelete.id }),
      ]);
      await Promise.all([
        ...scenes.map(i => base44.entities.CallSheetScene.delete(i.id)),
        ...crew.map(i => base44.entities.CallSheetCrew.delete(i.id)),
        ...checklist.map(i => base44.entities.CallSheetChecklist.delete(i.id)),
      ]);
      await base44.entities.CallSheet.delete(toDelete.id);
      setSheets(prev => prev.filter(s => s.id !== toDelete.id));
      toast.success("Ordem do Dia excluída.");
    } catch {
      toast.error("Erro ao excluir.");
    } finally {
      setIsDeleting(false);
      setToDelete(null);
    }
  };

  const getClientName = (id) => clients?.find(c => c.id === id)?.nome_fantasia || "—";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground tracking-tight">Ordem do Dia</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{sheets.length} Call Sheet(s) cadastrada(s)</p>
        </div>
        <Button onClick={handleNew} className="bg-violet-600 hover:bg-violet-700 text-white gap-2">
          <Plus className="w-4 h-4" /> Nova Ordem do Dia
        </Button>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="text-left px-4 py-3 text-zinc-500 font-medium text-xs uppercase tracking-wider">Data</th>
              <th className="text-left px-4 py-3 text-zinc-500 font-medium text-xs uppercase tracking-wider">Projeto</th>
              <th className="text-left px-4 py-3 text-zinc-500 font-medium text-xs uppercase tracking-wider">Cliente</th>
              <th className="text-left px-4 py-3 text-zinc-500 font-medium text-xs uppercase tracking-wider">Call Time</th>
              <th className="text-center px-4 py-3 text-zinc-500 font-medium text-xs uppercase tracking-wider">Versão</th>
              <th className="text-left px-4 py-3 text-zinc-500 font-medium text-xs uppercase tracking-wider">Local</th>
              <th className="w-10 px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-zinc-500">Carregando...</td></tr>
            )}
            {!loading && sheets.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center">
                  <FileText className="w-10 h-10 text-zinc-800 mx-auto mb-3" />
                  <p className="text-zinc-500 text-sm">Nenhuma Ordem do Dia. Clique em "Nova Ordem do Dia" para começar.</p>
                </td>
              </tr>
            )}
            {sheets.map(s => (
              <tr key={s.id} onClick={() => handleEdit(s)} className="border-b border-zinc-800/60 hover:bg-zinc-800/30 cursor-pointer transition-colors group">
                <td className="px-4 py-3 text-zinc-300 font-medium">
                  {s.date ? new Date(s.date + "T00:00:00").toLocaleDateString("pt-BR") : "—"}
                </td>
                <td className="px-4 py-3 text-zinc-100 font-semibold">{s.project_name}</td>
                <td className="px-4 py-3 text-zinc-400">{getClientName(s.client_id)}</td>
                <td className="px-4 py-3 text-zinc-400 font-mono">{s.general_call_time || "—"}</td>
                <td className="px-4 py-3 text-center">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-zinc-800 text-zinc-300 text-xs font-bold border border-zinc-700">
                    v{s.version || 1}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-500 text-xs max-w-[200px] truncate">{s.location_address || "—"}</td>
                <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0 text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 bg-zinc-900 border-zinc-800 text-zinc-300">
                      <DropdownMenuItem onClick={() => handleEdit(s)} className="cursor-pointer hover:bg-zinc-800 hover:text-white">
                        <Pencil className="w-4 h-4 mr-2" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleGenerateLink(s)} className="cursor-pointer hover:bg-zinc-800 hover:text-white">
                        <Link2 className="w-4 h-4 mr-2" /> Gerar Link Partilhável
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleWhatsapp(s)} className="cursor-pointer hover:bg-zinc-800 hover:text-white">
                        <MessageCircle className="w-4 h-4 mr-2" /> Enviar por WhatsApp
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setToDelete(s)} className="cursor-pointer text-red-400 hover:bg-red-500/10 focus:text-red-400 focus:bg-red-500/10">
                        <Trash2 className="w-4 h-4 mr-2" /> Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Form Modal */}
      <CallSheetForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        callSheet={editing}
        tenantId={tenantId}
        clients={clients}
        onSaved={() => { load(); setFormOpen(false); }}
      />

      {/* Delete Confirm */}
      <Dialog open={!!toDelete} onOpenChange={() => !isDeleting && setToDelete(null)}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 max-w-sm p-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <AlertTriangle className="w-7 h-7 text-red-500" />
            </div>
            <div>
              <h2 className="font-heading text-xl font-bold">Excluir Ordem do Dia</h2>
              <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
                Tem certeza que deseja excluir a OD <strong className="text-zinc-200">{toDelete?.project_name}</strong>?<br />
                <span className="text-red-400">Esta ação não poderá ser desfeita.</span>
              </p>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <Button variant="outline" onClick={() => setToDelete(null)} disabled={isDeleting} className="flex-1 border-zinc-700 text-zinc-300 hover:bg-zinc-800">Cancelar</Button>
            <Button onClick={confirmDelete} disabled={isDeleting} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
              {isDeleting ? "Excluindo..." : "Sim, excluir"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}