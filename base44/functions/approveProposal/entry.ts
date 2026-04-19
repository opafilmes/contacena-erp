import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { proposalId } = await req.json();
    if (!proposalId) return Response.json({ error: 'proposalId required' }, { status: 400 });

    // Fetch proposal
    const proposals = await base44.asServiceRole.entities.Proposal.filter({ id: proposalId });
    const proposal = proposals?.[0];
    if (!proposal) return Response.json({ error: 'Proposal not found' }, { status: 404 });

    // Fetch proposal items to build contract body
    const items = await base44.asServiceRole.entities.ProposalItem.filter({ proposal_id: proposalId });

    // Fetch client for variable substitution
    let client = null;
    if (proposal.client_id) {
      const clients = await base44.asServiceRole.entities.Client.filter({ id: proposal.client_id });
      client = clients?.[0] || null;
    }

    // Build contract body with mapped data
    const propNum = proposal.numero_proposta ? `PROP-${proposal.numero_proposta}` : proposalId.slice(-6).toUpperCase();
    const valorFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(proposal.valor_total || 0);

    let itensHTML = '';
    if (items && items.length > 0) {
      itensHTML = `
<h3>ESCOPO DE SERVIÇOS</h3>
<table border="1" cellpadding="6" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:12px">
  <thead>
    <tr style="background:#f3f4f6">
      <th align="left">Descrição</th>
      <th align="center">Qtd</th>
      <th align="right">Unit.</th>
      <th align="right">Total</th>
    </tr>
  </thead>
  <tbody>
    ${items.map(i => `
    <tr>
      <td>${i.titulo}${i.descricao_detalhada ? '<br/><small>' + i.descricao_detalhada.replace(/<[^>]*>/g, '') + '</small>' : ''}</td>
      <td align="center">${i.quantidade || 1}</td>
      <td align="right">${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(i.valor_unitario || 0)}</td>
      <td align="right">${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(i.valor_total || 0)}</td>
    </tr>`).join('')}
  </tbody>
</table>`;
    }

    const corpo = `<h2>CONTRATO DE PRESTAÇÃO DE SERVIÇOS – ${propNum}</h2>
<p><strong>CONTRATANTE:</strong> ${client?.nome_fantasia || '{{nome_cliente}}'} – CNPJ/CPF: ${client?.cnpj_cpf || '{{cpf_cnpj}}'}</p>
<p><strong>CONTRATADA:</strong> {{razao_social_prestador}} – CNPJ: {{cnpj_prestador}}</p>
<hr/>
${itensHTML}
<h3>VALOR TOTAL</h3>
<p>O valor total dos serviços contratados é de <strong>${valorFmt}</strong>.</p>
${proposal.observacoes ? `<h3>OBSERVAÇÕES E TERMOS</h3>${proposal.observacoes}` : ''}
${proposal.tipo_proposta === 'Recorrente' && proposal.vigencia_meses ? `<h3>VIGÊNCIA</h3><p>Este contrato tem vigência de <strong>${proposal.vigencia_meses} meses</strong> a partir da data de início, com renovação automática salvo aviso prévio de 30 dias.</p>` : ''}
<p><em>Gerado automaticamente a partir da ${propNum} em ${new Date().toLocaleDateString('pt-BR')}.</em></p>`;

    // 1. Update proposal status
    await base44.asServiceRole.entities.Proposal.update(proposalId, { status: 'Aprovada' });

    // 2. Create Contract with body
    const contratoTipo = proposal.tipo_proposta === 'Recorrente' ? 'Recorrente' : 'Avulso';
    const contrato = await base44.asServiceRole.entities.Contract.create({
      titulo: `Contrato – ${client?.nome_fantasia || propNum}`,
      client_id: proposal.client_id || undefined,
      tipo: contratoTipo,
      valor: proposal.valor_total || 0,
      status: 'Em Elaboração',
      corpo_contrato: corpo,
      proposal_id: proposalId,
      inquilino_id: proposal.tenant_id,
    });

    // 3. Create Job
    const job = await base44.asServiceRole.entities.Job.create({
      titulo: client?.nome_fantasia || propNum,
      status_kanban: 'Pré-produção',
      proposal_id: proposalId,
      tenant_id: proposal.tenant_id,
    });

    // 4. Create AccountReceivable
    await base44.asServiceRole.entities.AccountReceivable.create({
      descricao: `Recebimento – ${client?.nome_fantasia || propNum}`,
      valor: proposal.valor_total || 0,
      status: 'Pendente',
      client_id: proposal.client_id || undefined,
      job_id: job.id,
      inquilino_id: proposal.tenant_id,
    });

    return Response.json({ ok: true, contract_id: contrato.id, job_id: job.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});