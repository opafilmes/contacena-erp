import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { X, ChevronDown } from "lucide-react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { formatBRL } from "@/utils/format";

// ── Modelos de contratos audiovisuais ────────────────────────────────
const MODELOS = [
  {
    id: "social_media",
    label: "Social Media",
    body: `<h2>CONTRATO DE PRESTAÇÃO DE SERVIÇOS – GESTÃO DE SOCIAL MEDIA</h2>
<p>Por este instrumento, as partes abaixo qualificadas celebram o presente Contrato de Prestação de Serviços de Social Media:</p>
<p><strong>CONTRATANTE:</strong> {{nome_cliente}} – CNPJ/CPF: {{cpf_cnpj}}</p>
<p><strong>CONTRATADA:</strong> {{razao_social_prestador}} – CNPJ: {{cnpj_prestador}}</p>
<hr/>
<h3>1. OBJETO</h3>
<p>A CONTRATADA se compromete a prestar serviços mensais de produção e gestão de conteúdo para redes sociais, incluindo <strong>{{qtd_posts}} posts</strong> e <strong>{{qtd_reels}} reels/vídeos</strong> por mês.</p>
<h3>2. PRAZO E VIGÊNCIA</h3>
<p>O contrato tem vigência de <strong>{{vigencia_meses}} meses</strong>, iniciando em <strong>{{data_inicio}}</strong> e com renovação automática salvo aviso prévio de 30 dias.</p>
<h3>3. APROVAÇÃO DE CONTEÚDO</h3>
<p>O CONTRATANTE terá prazo de <strong>48 horas úteis</strong> para aprovar ou solicitar ajustes em cada conteúdo entregue. Após este prazo, o conteúdo será considerado aprovado automaticamente. São permitidas até <strong>2 (duas) rodadas de alteração</strong> por peça.</p>
<h3>4. VALOR E PAGAMENTO</h3>
<p>O valor mensal contratado é de <strong>{{valor_total}}</strong>, com vencimento todo dia <strong>{{dia_vencimento}}</strong> do mês, mediante <strong>{{metodo_pagamento}}</strong>.</p>
<h3>5. PROPRIEDADE INTELECTUAL</h3>
<p>Todo o conteúdo produzido durante a vigência é de propriedade do CONTRATANTE, após quitação integral dos valores devidos.</p>
<h3>6. RESCISÃO</h3>
<p>Qualquer das partes poderá rescindir este contrato mediante aviso prévio de 30 (trinta) dias, sem multa, desde que não haja inadimplência.</p>`,
  },
  {
    id: "eventos",
    label: "Eventos e Festas",
    body: `<h2>CONTRATO DE COBERTURA FOTOGRÁFICA E AUDIOVISUAL DE EVENTO</h2>
<p><strong>CONTRATANTE:</strong> {{nome_cliente}} – CNPJ/CPF: {{cpf_cnpj}}</p>
<p><strong>CONTRATADA:</strong> {{razao_social_prestador}} – CNPJ: {{cnpj_prestador}}</p>
<hr/>
<h3>1. OBJETO</h3>
<p>Cobertura fotográfica e audiovisual completa do evento a realizar-se em <strong>{{data_evento}}</strong>, no endereço <strong>{{local_evento}}</strong>.</p>
<h3>2. ENTREGÁVEIS</h3>
<ul>
  <li>Fotos editadas: entrega em até <strong>15 (quinze) dias úteis</strong> após o evento.</li>
  <li>Vídeo editado (highlight): entrega em até <strong>30 (trinta) dias úteis</strong> após o evento.</li>
  <li>Todos os arquivos serão entregues via link de download em alta resolução.</li>
</ul>
<h3>3. VALOR E FORMA DE PAGAMENTO</h3>
<p>Valor total: <strong>{{valor_total}}</strong>. Sinal de 50% no ato da assinatura e saldo no dia do evento.</p>
<h3>4. CLÁUSULA DE ALIMENTAÇÃO E TRANSPORTE</h3>
<p>Para eventos com duração superior a 4 horas ou realizados fora do município sede da CONTRATADA, o CONTRATANTE compromete-se a fornecer alimentação e/ou ressarcir os custos de deslocamento previamente acordados.</p>
<h3>5. CANCELAMENTO</h3>
<p>Em caso de cancelamento pelo CONTRATANTE com menos de <strong>7 (sete) dias</strong> do evento, o sinal não será devolvido. Cancelamentos com mais de 30 dias têm devolução de 100% do sinal.</p>`,
  },
  {
    id: "institucional",
    label: "Produção Institucional",
    body: `<h2>CONTRATO DE PRODUÇÃO AUDIOVISUAL INSTITUCIONAL</h2>
<p><strong>CONTRATANTE:</strong> {{nome_cliente}} – CNPJ/CPF: {{cpf_cnpj}}</p>
<p><strong>CONTRATADA:</strong> {{razao_social_prestador}} – CNPJ: {{cnpj_prestador}}</p>
<hr/>
<h3>1. OBJETO E ETAPAS</h3>
<p>Produção de vídeo institucional contemplando as seguintes etapas:</p>
<ul>
  <li><strong>Fase 1 – Pré-produção:</strong> Elaboração de roteiro e aprovação pelo CONTRATANTE (prazo: 5 dias úteis para feedback).</li>
  <li><strong>Fase 2 – Captação:</strong> Filmagem conforme cronograma acordado.</li>
  <li><strong>Fase 3 – Pós-produção:</strong> Edição, correção de cor e finalização.</li>
</ul>
<h3>2. REVISÕES</h3>
<p>Estão incluídas no valor contratado até <strong>2 (duas) rodadas de revisão</strong> após a entrega do primeiro corte. Revisões adicionais serão cobradas à parte, no valor de <strong>R$ 300,00 por hora</strong> de edição.</p>
<h3>3. VALOR</h3>
<p>Valor total da produção: <strong>{{valor_total}}</strong>, dividido em: 40% na assinatura, 30% no início das filmagens e 30% na entrega final aprovada.</p>
<h3>4. PRAZO DE ENTREGA</h3>
<p>O vídeo finalizado será entregue em até <strong>{{prazo_entrega}} dias úteis</strong> após a aprovação do roteiro.</p>
<h3>5. PROPRIEDADE E USO</h3>
<p>Após quitação integral, o CONTRATANTE detém os direitos de exibição do material produzido. A CONTRATADA reserva o direito de usar o material em seu portfólio, salvo cláusula de confidencialidade expressamente pactuada.</p>`,
  },
  {
    id: "uso_imagem",
    label: "Autorização de Uso de Imagem",
    body: `<h2>AUTORIZAÇÃO DE USO DE IMAGEM E VOZ</h2>
<p>Pelo presente instrumento, o(a) AUTORIZANTE abaixo qualificado(a) concede autorização de uso de imagem e voz à CESSIONÁRIA:</p>
<p><strong>AUTORIZANTE:</strong> {{nome_autorizante}} – CPF: {{cpf_autorizante}}</p>
<p><strong>CESSIONÁRIA (Beneficiária):</strong> {{nome_cliente}} – CNPJ/CPF: {{cpf_cnpj}}</p>
<p><strong>CONTRATADA (Produtora):</strong> {{razao_social_prestador}} – CNPJ: {{cnpj_prestador}}</p>
<hr/>
<h3>1. OBJETO</h3>
<p>O(a) AUTORIZANTE autoriza, em caráter gratuito/oneroso (conforme acordado), o uso de sua imagem e voz captadas durante as gravações realizadas em <strong>{{data_gravacao}}</strong>.</p>
<h3>2. FINALIDADE E TERRITÓRIO</h3>
<p>As imagens poderão ser utilizadas pela CESSIONÁRIA para fins de divulgação institucional, publicidade, redes sociais e demais mídias digitais e impressas, sem limitação territorial, pelo prazo de <strong>{{prazo_uso}} anos</strong>.</p>
<h3>3. VEDAÇÕES</h3>
<p>É expressamente vedado o uso das imagens em contextos que possam denegrir a imagem ou honra do(a) AUTORIZANTE, ou para fins políticos-partidários sem consentimento expresso.</p>
<h3>4. REMUNERAÇÃO</h3>
<p>Pela presente autorização, o(a) AUTORIZANTE receberá a importância de <strong>{{valor_total}}</strong> (ou declara que a autorização é gratuita, conforme ajuste prévio).</p>
<p><em>Local e data: _________________, ___/___/______</em></p>
<p>______________________________ &nbsp;&nbsp;&nbsp; ______________________________</p>
<p>{{nome_autorizante}} (AUTORIZANTE) &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; {{nome_cliente}} (CESSIONÁRIA)</p>`,
  },
];

// ── Variáveis dinâmicas disponíveis ──────────────────────────────────
const VARIAVEIS_PADRAO = [
  { label: "Nome do Cliente", code: "{{nome_cliente}}" },
  { label: "CNPJ/CPF", code: "{{cpf_cnpj}}" },
  { label: "Valor Total", code: "{{valor_total}}" },
  { label: "Data Início", code: "{{data_inicio}}" },
  { label: "Vigência (meses)", code: "{{vigencia_meses}}" },
  { label: "Dia Vencimento", code: "{{dia_vencimento}}" },
  { label: "Método Pagamento", code: "{{metodo_pagamento}}" },
  { label: "Razão Social Prestador", code: "{{razao_social_prestador}}" },
  { label: "CNPJ Prestador", code: "{{cnpj_prestador}}" },
];

const VARIAVEIS_IMAGEM = [
  { label: "Nome do Autorizante", code: "{{nome_autorizante}}" },
  { label: "CPF do Autorizante", code: "{{cpf_autorizante}}" },
  { label: "Nome do Cliente (Cessionária)", code: "{{nome_cliente}}" },
  { label: "CNPJ/CPF Cliente", code: "{{cpf_cnpj}}" },
  { label: "Razão Social Prestador", code: "{{razao_social_prestador}}" },
  { label: "CNPJ Prestador", code: "{{cnpj_prestador}}" },
  { label: "Data da Gravação", code: "{{data_gravacao}}" },
  { label: "Prazo de Uso (anos)", code: "{{prazo_uso}}" },
  { label: "Valor Total", code: "{{valor_total}}" },
];

const QUILL_MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline"],
    [{ list: "bullet" }, { list: "ordered" }],
    ["link"],
    ["clean"],
  ],
};

const BLANK = {
  titulo: "",
  client_id: "",
  tipo: "Avulso",
  valor: "",
  data_inicio: "",
  data_fim: "",
  status: "Em Elaboração",
  corpo_contrato: "",
  nome_autorizante: "",
  cpf_autorizante: "",
};

export default function ContractDrawer({ open, onClose, record, tenantId, clients, onSaved }) {
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [showVarMenu, setShowVarMenu] = useState(false);
  const [selectedModelo, setSelectedModelo] = useState(null);
  const quillRef = useRef(null);

  const isImagemModel = selectedModelo === "uso_imagem";

  useEffect(() => {
    if (open) {
      setSelectedModelo(null);
      setForm(record ? {
        titulo:           record.titulo           || "",
        client_id:        record.client_id        || "",
        tipo:             record.tipo             || "Avulso",
        valor:            record.valor            ?? "",
        data_inicio:      record.data_inicio      || "",
        data_fim:         record.data_fim         || "",
        status:           record.status           || "Em Elaboração",
        corpo_contrato:   record.corpo_contrato   || "",
        nome_autorizante: record.nome_autorizante || "",
        cpf_autorizante:  record.cpf_autorizante  || "",
      } : BLANK);
    }
  }, [open, record]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Insere variável na posição do cursor do Quill
  const insertVar = (code) => {
    const editor = quillRef.current?.getEditor();
    if (editor) {
      const range = editor.getSelection(true);
      editor.insertText(range ? range.index : editor.getLength(), code);
    }
    setShowVarMenu(false);
  };

  const applyModelo = (modelo) => {
    setSelectedModelo(modelo.id);
    set("corpo_contrato", modelo.body);
    // Auto-fill título se vazio
    if (!form.titulo) set("titulo", modelo.label);
  };

  const handleSave = async () => {
    if (!form.titulo.trim()) { toast.error("Título obrigatório."); return; }
    setSaving(true);
    const payload = {
      ...form,
      valor: (!isImagemModel && form.valor !== "") ? Number(form.valor) : undefined,
      client_id:        form.client_id        || undefined,
      data_inicio:      (!isImagemModel && form.data_inicio) ? form.data_inicio : undefined,
      data_fim:         form.data_fim         || undefined,
      corpo_contrato:   form.corpo_contrato   || undefined,
      nome_autorizante: form.nome_autorizante || undefined,
      cpf_autorizante:  form.cpf_autorizante  || undefined,
      inquilino_id:     tenantId,
    };
    if (record?.id) {
      await base44.entities.Contract.update(record.id, payload);
      toast.success("Contrato atualizado!");
    } else {
      await base44.entities.Contract.create(payload);
      toast.success("Contrato criado!");
    }
    setSaving(false);
    onSaved();
    onClose();
  };

  if (!open) return null;

  const variaveis = isImagemModel ? VARIAVEIS_IMAGEM : VARIAVEIS_PADRAO;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative h-full w-full max-w-3xl bg-card border-l border-border/50 flex flex-col shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/30 bg-secondary/20 shrink-0">
          <h2 className="font-heading font-bold text-lg">{record ? "Editar Contrato" : "Novo Contrato"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* ── Selecionar Modelo ── */}
          {!record && (
            <div className="relative">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Começar com um Modelo</p>
              <div className="flex flex-wrap gap-2">
                {MODELOS.map(m => (
                  <button
                    key={m.id}
                    onClick={() => applyModelo(m)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      selectedModelo === m.id
                        ? "bg-accent/20 border-accent/50 text-accent"
                        : "border-border/50 bg-secondary/30 hover:bg-accent/10 hover:border-accent/40 hover:text-accent"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              {isImagemModel && (
                <p className="mt-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-1.5">
                  ℹ️ Modelo de Autorização de Imagem: campos financeiros ocultados. Preencha os dados do autorizante abaixo.
                </p>
              )}
            </div>
          )}

          {/* ── Metadados ── */}
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1.5">
              <Label>Título *</Label>
              <Input value={form.titulo} onChange={e => set("titulo", e.target.value)} placeholder="Ex: Contrato Anual de Social Media" />
            </div>

            <div className={`grid gap-3 ${isImagemModel ? "grid-cols-1" : "grid-cols-2"}`}>
              <div className="space-y-1.5">
                <Label>{isImagemModel ? "Beneficiário (Cliente / Cessionária)" : "Cliente"}</Label>
                <Select value={form.client_id} onValueChange={v => set("client_id", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                  <SelectContent>
                    {(clients || []).map(c => <SelectItem key={c.id} value={c.id}>{c.nome_fantasia}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {!isImagemModel && (
                <div className="space-y-1.5">
                  <Label>Tipo</Label>
                  <Select value={form.tipo} onValueChange={v => set("tipo", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Avulso">Avulso</SelectItem>
                      <SelectItem value="Recorrente">Recorrente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Campos exclusivos de Autorização de Imagem */}
            {isImagemModel && (
              <div className="grid grid-cols-2 gap-3 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
                <p className="col-span-2 text-xs font-semibold text-amber-400 uppercase tracking-wider">Dados do Autorizante</p>
                <div className="space-y-1.5">
                  <Label>Nome do Autorizante *</Label>
                  <Input
                    value={form.nome_autorizante}
                    onChange={e => set("nome_autorizante", e.target.value)}
                    placeholder="Nome completo"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>CPF do Autorizante *</Label>
                  <Input
                    value={form.cpf_autorizante}
                    onChange={e => set("cpf_autorizante", e.target.value)}
                    placeholder="000.000.000-00"
                  />
                </div>
              </div>
            )}

            {/* Campos financeiros — ocultos no modelo de imagem */}
            {!isImagemModel && (
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={v => set("status", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Em Elaboração">Em Elaboração</SelectItem>
                      <SelectItem value="Ativo">Ativo</SelectItem>
                      <SelectItem value="Finalizado">Finalizado</SelectItem>
                      <SelectItem value="Cancelado">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Valor (R$)</Label>
                  <Input type="number" step="0.01" value={form.valor} onChange={e => set("valor", e.target.value)} placeholder="0,00" />
                </div>
                <div className="space-y-1.5">
                  <Label>Data Início</Label>
                  <Input type="date" value={form.data_inicio} onChange={e => set("data_inicio", e.target.value)} />
                </div>
              </div>
            )}
          </div>

          {/* ── Editor Rich Text ── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">Corpo do Contrato</Label>

              {/* Botão de Variáveis */}
              <div className="relative">
                <button
                  onClick={() => setShowVarMenu(v => !v)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-accent/30 text-accent bg-accent/10 hover:bg-accent/20 transition-colors"
                >
                  {"{{ }}"} Variáveis <ChevronDown className="w-3 h-3" />
                </button>
                {showVarMenu && (
                  <div className="absolute right-0 top-8 z-20 bg-popover border border-border/50 rounded-xl shadow-xl w-60 py-1 max-h-64 overflow-y-auto">
                    {variaveis.map(v => (
                      <button
                        key={v.code}
                        onClick={() => insertVar(v.code)}
                        className="w-full text-left px-4 py-2 text-xs hover:bg-secondary/50 transition-colors"
                      >
                        <span className="text-accent font-mono">{v.code}</span>
                        <br />
                        <span className="text-muted-foreground">{v.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="quill-dark rounded-md overflow-hidden border border-border/40 min-h-[320px]">
              <ReactQuill
                ref={quillRef}
                value={form.corpo_contrato || ""}
                onChange={v => set("corpo_contrato", v)}
                theme="snow"
                placeholder="Escreva o corpo do contrato aqui, ou selecione um modelo acima..."
                modules={QUILL_MODULES}
                style={{ minHeight: 320 }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {isImagemModel
                ? <>Use <span className="font-mono text-accent">{"{{nome_autorizante}}"}</span>, <span className="font-mono text-accent">{"{{cpf_autorizante}}"}</span> etc. para dados do autorizante.</>
                : <>Use <span className="font-mono text-accent">{"{{nome_cliente}}"}</span>, <span className="font-mono text-accent">{"{{valor_total}}"}</span> etc. — serão substituídos pelos dados reais ao imprimir.</>
              }
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 flex gap-3 px-6 py-4 border-t border-border/30 bg-secondary/10">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button className="flex-1" onClick={handleSave} disabled={saving}>
            {saving ? "Salvando..." : record ? "Atualizar Contrato" : "Criar Contrato"}
          </Button>
        </div>
      </div>
    </div>
  );
}