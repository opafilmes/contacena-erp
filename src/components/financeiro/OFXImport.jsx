import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Upload, X, ArrowUpCircle, ArrowDownCircle, Check } from "lucide-react";
import { formatBRL } from "@/utils/format";

function parseOFX(text) {
  const entries = [];
  const stmtPattern = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/g;
  let match;
  while ((match = stmtPattern.exec(text)) !== null) {
    const block = match[1];
    const get = (tag) => { const m = block.match(new RegExp(`<${tag}>([^<\r\n]+)`)); return m ? m[1].trim() : ""; };
    const amount = parseFloat(get("TRNAMT").replace(",", "."));
    const dtposted = get("DTPOSTED");
    const year = dtposted.slice(0, 4);
    const month = dtposted.slice(4, 6);
    const day = dtposted.slice(6, 8);
    entries.push({
      _id: get("FITID") || Math.random().toString(36),
      memo: get("MEMO") || get("NAME"),
      amount,
      date: `${year}-${month}-${day}`,
      type: amount >= 0 ? "receber" : "pagar",
    });
  }
  return entries;
}

export default function OFXImport({ tenantId, onImported }) {
  const inputRef = useRef();
  const [entries, setEntries] = useState([]);
  const [selected, setSelected] = useState({});
  const [importing, setImporting] = useState(false);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const parsed = parseOFX(ev.target.result);
      setEntries(parsed);
      const sel = {};
      parsed.forEach(p => { sel[p._id] = true; });
      setSelected(sel);
    };
    reader.readAsText(file, "latin1");
  };

  const handleImport = async () => {
    setImporting(true);
    const toImport = entries.filter(e => selected[e._id]);
    for (const e of toImport) {
      if (e.type === "receber") {
        await base44.entities.AccountReceivable.create({
          descricao: e.memo || "Importado OFX",
          valor: Math.abs(e.amount),
          data_vencimento: e.date,
          status: "Recebido",
          inquilino_id: tenantId,
        });
      } else {
        await base44.entities.AccountPayable.create({
          descricao: e.memo || "Importado OFX",
          valor: Math.abs(e.amount),
          data_vencimento: e.date,
          status: "Pago",
          inquilino_id: tenantId,
        });
      }
    }
    setImporting(false);
    setEntries([]);
    toast.success(`${toImport.length} lançamento(s) importado(s)!`);
    onImported();
  };

  const toggleAll = (v) => {
    const s = {};
    entries.forEach(e => { s[e._id] = v; });
    setSelected(s);
  };

  if (entries.length === 0) {
    return (
      <>
        <input ref={inputRef} type="file" accept=".ofx,.OFX" className="hidden" onChange={handleFile} />
        <Button size="sm" variant="outline" onClick={() => inputRef.current.click()} className="border-white/10 text-muted-foreground hover:text-foreground">
          <Upload className="w-4 h-4 mr-2" /> Importar OFX
        </Button>
      </>
    );
  }

  const selectedCount = Object.values(selected).filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-popover border border-border rounded-2xl w-full max-w-xl max-h-[80vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <div>
            <p className="font-heading font-semibold text-foreground">Importar OFX</p>
            <p className="text-xs text-muted-foreground">{entries.length} lançamento(s) encontrado(s)</p>
          </div>
          <button onClick={() => setEntries([])} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 border-b border-border/30">
          <button onClick={() => toggleAll(true)} className="text-xs text-primary hover:underline">Selecionar todos</button>
          <span className="text-muted-foreground/40">|</span>
          <button onClick={() => toggleAll(false)} className="text-xs text-muted-foreground hover:underline">Desmarcar todos</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
          {entries.map(e => (
            <div
              key={e._id}
              onClick={() => setSelected(s => ({ ...s, [e._id]: !s[e._id] }))}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${selected[e._id] ? "bg-primary/10 border border-primary/20" : "bg-white/[0.02] border border-transparent hover:bg-white/[0.04]"}`}
            >
              <div className={`w-4 h-4 rounded flex items-center justify-center border ${selected[e._id] ? "bg-primary border-primary" : "border-border"}`}>
                {selected[e._id] && <Check className="w-2.5 h-2.5 text-white" />}
              </div>
              {e.type === "receber"
                ? <ArrowUpCircle className="w-4 h-4 text-green-400 shrink-0" />
                : <ArrowDownCircle className="w-4 h-4 text-red-400 shrink-0" />
              }
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate text-foreground/85">{e.memo}</p>
                <p className="text-xs text-muted-foreground">{e.date}</p>
              </div>
              <span className={`text-sm font-semibold tabular-nums ${e.type === "receber" ? "text-green-400" : "text-red-400"}`}>
                {formatBRL(Math.abs(e.amount))}
              </span>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-border/50 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setEntries([])}>Cancelar</Button>
          <Button size="sm" onClick={handleImport} disabled={importing || selectedCount === 0}>
            {importing ? "Importando..." : `Importar ${selectedCount} lançamento(s)`}
          </Button>
        </div>
      </div>
    </div>
  );
}