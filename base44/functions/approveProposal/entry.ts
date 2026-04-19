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

    // 1. Update proposal status
    await base44.asServiceRole.entities.Proposal.update(proposalId, { status: 'Aprovada' });

    // 2. Create Contract
    const contratoTipo = proposal.tipo_proposta === 'Recorrente' ? 'Recorrente' : 'Avulso';
    const contrato = await base44.asServiceRole.entities.Contract.create({
      titulo: proposal.titulo,
      client_id: proposal.client_id || undefined,
      tipo: contratoTipo,
      valor: proposal.valor_total || 0,
      status: 'Ativo',
      inquilino_id: proposal.tenant_id,
    });

    // 3. Create Job
    const job = await base44.asServiceRole.entities.Job.create({
      titulo: proposal.titulo,
      status_kanban: 'Pré-produção',
      proposal_id: proposalId,
      tenant_id: proposal.tenant_id,
    });

    // 4. Create AccountReceivable
    await base44.asServiceRole.entities.AccountReceivable.create({
      descricao: `Recebimento - ${proposal.titulo}`,
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