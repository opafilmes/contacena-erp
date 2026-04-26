import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Upload, CheckSquare, Square } from "lucide-react";
import { toast } from "sonner";

const EMPTY_SCENE = { scene_number: "", description: "", start_time: "", end_time: "", cast_ids: "", storyboard_url: "", status: "Pendente" };
const EMPTY_CREW = { name: "", role: "", specific_call_time: "", contract_status: "Pendente" };
const EMPTY_CHECK = { item_name: "", category: "Equipamento", is_checked: false };

function generateToken() {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function CallSheetForm({ open, onClose, callSheet, tenantId, clients, onSaved }) {
  const [form, setForm] = useState({});
  const [scenes, setScenes] = useState([{ ...EMPTY_SCENE }]);
  const [crew, setCrew] = useState([{ ...EMPTY_CREW }]);
  const [checklist, setChecklist] = useState([{ ...EMPTY_CHECK }]);
  const [saving, setSaving] = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState(null);

  useEffect(() => {
    if (!open) return;
    if (callSheet) {
      setForm({ ...callSheet });
      // Load related data
      Promise.all([
        base44.entities.CallSheetScene.filter({ call_sheet_id: callSheet.id }, "created_date"),
        base44.entities.CallSheetCrew.filter({ call_sheet_id: callSheet.id }, "created_date"),
        base44.entities.CallSheetChecklist.filter({ call_sheet_id: callSheet.id }, "created_date"),
      ]).then(([sc, cr, ch]) => {
        setScenes(sc.length ? sc : [{ ...EMPTY_SCENE }]);
        setCrew(cr.length ? cr : [{ ...EMPTY_CREW }]);
        setChecklist(ch.length ? ch : [{ ...EMPTY_CHECK }]);
      });
    } else {
      setForm({
        project_name: "", client_id: "", date: new Date().toISOString().slice(0, 10),
        location_address: "", weather_forecast: "", general_call_time: "07:00", version: 1,
        magic_link_token: generateToken(),
      });
      setScenes([{ ...EMPTY_SCENE }]);
      setCrew([{ ...EMPTY_CREW }]);
      setChecklist([{ ...EMPTY_CHECK }]);
    }
  }, [open, callSheet]);

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Scene helpers
  const updateScene = (idx, key, val) => setScenes(prev => { const n = [...prev]; n[idx] = { ...n[idx], [key]: val }; return n; });
  const addScene = () => setScenes(prev => [...prev, { ...EMPTY_SCENE }]);
  const removeScene = (idx) => setScenes(prev => prev.filter((_, i) => i !== idx));

  // Crew helpers
  const updateCrew = (idx, key, val) => setCrew(prev => { const n = [...prev]; n[idx] = { ...n[idx], [key]: val }; return n; });
  const addCrew = () => setCrew(prev => [...prev, { ...EMPTY_CREW }]);
  const removeCrew = (idx) => setCrew(prev => prev.filter((_, i) => i !== idx));

  // Checklist helpers
  const updateCheck = (idx, key, val) => setChecklist(prev => { const n = [...prev]; n[idx] = { ...n[idx], [key]: val }; return n; });
  const addCheck = () => setChecklist(prev => [...prev, { ...EMPTY_CHECK }]);
  const removeCheck = (idx) => setChecklist(prev => prev.filter((_, i) => i !== idx));

  const handleStoryboardUpload = async (idx, file) => {
    if (!file) return;
    setUploadingIdx(idx);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      updateScene(idx, "storyboard_url", file_url);
      toast.success("Imagem carregada!");
    } catch {
      toast.error("Erro ao carregar imagem.");
    } finally {
      setUploadingIdx(null);
    }
  };

  const handleSave = async () => {
    if (!form.project_name) { toast.error("Informe o nome do projeto."); return; }
    setSaving(true);
    try {
      const payload = { ...form, tenant_id: tenantId };
      let sheetId = callSheet?.id;

      if (callSheet) {
        await base44.entities.CallSheet.update(callSheet.id, payload);
        // Delete old related records
        const [oldScenes, oldCrew, oldCheck] = await Promise.all([
          base44.entities.CallSheetScene.filter({ call_sheet_id: sheetId }),
          base44.entities.CallSheetCrew.filter({ call_sheet_id: sheetId }),
          base44.entities.CallSheetChecklist.filter({ call_sheet_id: sheetId }),
        ]);
        await Promise.all([
          ...oldScenes.map(i => base44.entities.CallSheetScene.delete(i.id)),
          ...oldCrew.map(i => base44.entities.CallSheetCrew.delete(i.id)),
          ...oldCheck.map(i => base44.entities.CallSheetChecklist.delete(i.id)),
        ]);
      } else {
        const created = await base44.entities.CallSheet.create(payload);
        sheetId = created.id;
      }

      // Save related records
      await Promise.all([
        ...scenes.filter(s => s.scene_number).map(s =>
          base44.entities.CallSheetScene.create({ ...s, call_sheet_id: sheetId, tenant_id: tenantId })
        ),
        ...crew.filter(c => c.name).map(c =>
          base44.entities.CallSheetCrew.create({ ...c, call_sheet_id: sheetId, tenant_id: tenantId })
        ),
        ...checklist.filter(c => c.item_name).map(c =>
          base44.entities.CallSheetChecklist.create({ ...c, call_sheet_id: sheetId, tenant_id: tenantId })
        ),
      ]);

      toast.success(callSheet ? "Ordem do Dia atualizada!" : "Ordem do Dia criada!");
      onSaved();
    } catch {
      toast.error("Erro ao salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 w-full max-w-5xl h-[95vh] flex flex-col p-0 gap-0 overflow-hidden">

        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-zinc-800 shrink-0">
          <h2 className="font-heading text-lg font-semibold">
            {callSheet ? "Editar Ordem do Dia" : "Nova Ordem do Dia"}
          </h2>
          {/* Bloco 1: Cabeçalho */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="col-span-2 space-y-1">
              <Label className="text-zinc-400 text-xs uppercase tracking-wider">Nome do Projeto</Label>
              <Input value={form.project_name || ""} onChange={e => setField("project_name", e.target.value)}
                className="bg-zinc-900 border-zinc-700 text-zinc-200 h-8 text-sm" placeholder="Ex: Campanha Verão 2026" />
            </div>
            <div className="space-y-1">
              <Label className="text-zinc-400 text-xs uppercase tracking-wider">Cliente</Label>
              <Select value={form.client_id || ""} onValueChange={v => setField("client_id", v)}>
                <SelectTrigger className="bg-zinc-900 border-zinc-700 text-zinc-300 h-8 text-sm">
                  <SelectValue placeholder="Selecionar..." />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  {(clients || []).map(c => <SelectItem key={c.id} value={c.id}>{c.nome_fantasia}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-zinc-400 text-xs uppercase tracking-wider">Data</Label>
              <Input type="date" value={form.date || ""} onChange={e => setField("date", e.target.value)}
                className="bg-zinc-900 border-zinc-700 text-zinc-200 h-8 text-sm [color-scheme:dark]" />
            </div>
            <div className="space-y-1">
              <Label className="text-zinc-400 text-xs uppercase tracking-wider">Call Time Geral</Label>
              <Input type="time" value={form.general_call_time || ""} onChange={e => setField("general_call_time", e.target.value)}
                className="bg-zinc-900 border-zinc-700 text-zinc-200 h-8 text-sm [color-scheme:dark]" />
            </div>
            <div className="space-y-1">
              <Label className="text-zinc-400 text-xs uppercase tracking-wider">Versão</Label>
              <Input type="number" min={1} value={form.version || 1} onChange={e => setField("version", parseInt(e.target.value) || 1)}
                className="bg-zinc-900 border-zinc-700 text-zinc-200 h-8 text-sm" />
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-zinc-400 text-xs uppercase tracking-wider">Local da Gravação</Label>
              <Input value={form.location_address || ""} onChange={e => setField("location_address", e.target.value)}
                className="bg-zinc-900 border-zinc-700 text-zinc-200 h-8 text-sm" placeholder="Rua, Bairro, Cidade..." />
            </div>
            <div className="space-y-1">
              <Label className="text-zinc-400 text-xs uppercase tracking-wider">Previsão do Tempo</Label>
              <Input value={form.weather_forecast || ""} onChange={e => setField("weather_forecast", e.target.value)}
                className="bg-zinc-900 border-zinc-700 text-zinc-200 h-8 text-sm" placeholder="24°C - Ensolarado" />
            </div>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-8">

          {/* Bloco 2: Cenas */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-zinc-400 text-xs uppercase tracking-wider">Cenas / Cronograma</Label>
              <Button variant="ghost" size="sm" onClick={addScene} className="text-violet-400 hover:text-violet-300 gap-1.5 h-7">
                <Plus className="w-3.5 h-3.5" /> Adicionar Cena
              </Button>
            </div>
            <div className="space-y-3">
              {scenes.map((scene, idx) => (
                <div key={idx} className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
                  <div className="grid grid-cols-6 gap-2 mb-2">
                    <div className="space-y-1">
                      <Label className="text-zinc-500 text-[10px] uppercase">Cena Nº</Label>
                      <Input value={scene.scene_number} onChange={e => updateScene(idx, "scene_number", e.target.value)}
                        className="bg-zinc-900 border-zinc-700 text-zinc-200 h-7 text-xs" placeholder="04" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-zinc-500 text-[10px] uppercase">Início</Label>
                      <Input type="time" value={scene.start_time} onChange={e => updateScene(idx, "start_time", e.target.value)}
                        className="bg-zinc-900 border-zinc-700 text-zinc-200 h-7 text-xs [color-scheme:dark]" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-zinc-500 text-[10px] uppercase">Fim</Label>
                      <Input type="time" value={scene.end_time} onChange={e => updateScene(idx, "end_time", e.target.value)}
                        className="bg-zinc-900 border-zinc-700 text-zinc-200 h-7 text-xs [color-scheme:dark]" />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label className="text-zinc-500 text-[10px] uppercase">Descrição</Label>
                      <Input value={scene.description} onChange={e => updateScene(idx, "description", e.target.value)}
                        className="bg-zinc-900 border-zinc-700 text-zinc-200 h-7 text-xs" placeholder="Interna/Dia - Sala de Estar" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-zinc-500 text-[10px] uppercase">Status</Label>
                      <Select value={scene.status} onValueChange={v => updateScene(idx, "status", v)}>
                        <SelectTrigger className="bg-zinc-900 border-zinc-700 text-zinc-300 h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-700">
                          {["Pendente", "Em Gravação", "Concluída", "Adiada"].map(s => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 items-end">
                    <div className="space-y-1">
                      <Label className="text-zinc-500 text-[10px] uppercase">Elenco / Atores</Label>
                      <Input value={scene.cast_ids} onChange={e => updateScene(idx, "cast_ids", e.target.value)}
                        className="bg-zinc-900 border-zinc-700 text-zinc-200 h-7 text-xs" placeholder="João, Maria, Pedro..." />
                    </div>
                    <div className="flex gap-2 items-end">
                      <div className="flex-1 space-y-1">
                        <Label className="text-zinc-500 text-[10px] uppercase">Storyboard</Label>
                        {scene.storyboard_url ? (
                          <div className="flex items-center gap-2">
                            <img src={scene.storyboard_url} alt="storyboard" className="h-7 w-12 object-cover rounded border border-zinc-700" />
                            <button onClick={() => updateScene(idx, "storyboard_url", "")} className="text-xs text-zinc-500 hover:text-red-400">Remover</button>
                          </div>
                        ) : (
                          <label className="flex items-center gap-1.5 h-7 px-2 rounded border border-dashed border-zinc-700 bg-zinc-900 text-zinc-500 hover:text-zinc-300 hover:border-zinc-600 cursor-pointer transition-colors text-xs">
                            {uploadingIdx === idx ? "Carregando..." : <><Upload className="w-3 h-3" /> Upload imagem</>}
                            <input type="file" accept="image/*" className="hidden" onChange={e => handleStoryboardUpload(idx, e.target.files?.[0])} disabled={uploadingIdx === idx} />
                          </label>
                        )}
                      </div>
                      {scenes.length > 1 && (
                        <button onClick={() => removeScene(idx)} className="p-1.5 rounded hover:bg-red-500/15 text-zinc-600 hover:text-red-400 transition-colors mb-0.5">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Bloco 3: Equipa */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-zinc-400 text-xs uppercase tracking-wider">Equipe e Horários</Label>
              <Button variant="ghost" size="sm" onClick={addCrew} className="text-violet-400 hover:text-violet-300 gap-1.5 h-7">
                <Plus className="w-3.5 h-3.5" /> Adicionar Membro
              </Button>
            </div>
            <div className="rounded-lg border border-zinc-800 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-900/60 border-b border-zinc-800">
                    <th className="text-left px-3 py-2 text-zinc-500 text-[10px] uppercase">Nome</th>
                    <th className="text-left px-3 py-2 text-zinc-500 text-[10px] uppercase">Cargo/Função</th>
                    <th className="text-left px-3 py-2 text-zinc-500 text-[10px] uppercase">Call Time</th>
                    <th className="text-left px-3 py-2 text-zinc-500 text-[10px] uppercase">Contrato</th>
                    <th className="w-8 px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {crew.map((c, idx) => (
                    <tr key={idx} className="border-b border-zinc-800/60 last:border-0">
                      <td className="px-2 py-1.5">
                        <Input value={c.name} onChange={e => updateCrew(idx, "name", e.target.value)}
                          className="bg-zinc-900 border-zinc-700 text-zinc-200 h-7 text-xs" placeholder="Nome completo" />
                      </td>
                      <td className="px-2 py-1.5">
                        <Input value={c.role} onChange={e => updateCrew(idx, "role", e.target.value)}
                          className="bg-zinc-900 border-zinc-700 text-zinc-200 h-7 text-xs" placeholder="Ex: DOP, Gaffer..." />
                      </td>
                      <td className="px-2 py-1.5 w-28">
                        <Input type="time" value={c.specific_call_time} onChange={e => updateCrew(idx, "specific_call_time", e.target.value)}
                          className="bg-zinc-900 border-zinc-700 text-zinc-200 h-7 text-xs [color-scheme:dark]" />
                      </td>
                      <td className="px-2 py-1.5 w-32">
                        <Select value={c.contract_status} onValueChange={v => updateCrew(idx, "contract_status", v)}>
                          <SelectTrigger className="bg-zinc-900 border-zinc-700 text-zinc-300 h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-900 border-zinc-700">
                            <SelectItem value="Pendente">Pendente</SelectItem>
                            <SelectItem value="Assinado">Assinado</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-2 py-1.5 text-right">
                        {crew.length > 1 && (
                          <button onClick={() => removeCrew(idx)} className="p-1 rounded hover:bg-red-500/15 text-zinc-600 hover:text-red-400 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Bloco 4: Checklist */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-zinc-400 text-xs uppercase tracking-wider">Necessidades / Checklist</Label>
              <Button variant="ghost" size="sm" onClick={addCheck} className="text-violet-400 hover:text-violet-300 gap-1.5 h-7">
                <Plus className="w-3.5 h-3.5" /> Adicionar Item
              </Button>
            </div>
            <div className="space-y-1.5">
              {checklist.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2">
                  <button onClick={() => updateCheck(idx, "is_checked", !item.is_checked)} className="shrink-0 text-zinc-500 hover:text-violet-400 transition-colors">
                    {item.is_checked ? <CheckSquare className="w-4 h-4 text-violet-400" /> : <Square className="w-4 h-4" />}
                  </button>
                  <Input value={item.item_name} onChange={e => updateCheck(idx, "item_name", e.target.value)}
                    className={`bg-transparent border-none text-sm h-7 p-0 focus-visible:ring-0 flex-1 ${item.is_checked ? "line-through text-zinc-500" : "text-zinc-200"}`}
                    placeholder="Nome do item..." />
                  <Select value={item.category} onValueChange={v => updateCheck(idx, "category", v)}>
                    <SelectTrigger className="bg-zinc-900 border-zinc-700 h-7 text-xs w-28 shrink-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-700">
                      {["Equipamento", "Arte", "Figurino", "Outros"].map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {checklist.length > 1 && (
                    <button onClick={() => removeCheck(idx)} className="p-1 rounded hover:bg-red-500/15 text-zinc-600 hover:text-red-400 transition-colors shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-zinc-800 px-6 py-4 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} className="border-zinc-700 text-zinc-400 hover:text-zinc-200 px-6">Cancelar</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-violet-600 hover:bg-violet-700 text-white px-6">
            {saving ? "Salvando..." : "Salvar Ordem do Dia"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}