import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { event, data } = body;

    // Only act on update events where status became "Aprovada"
    if (event?.type !== 'update') {
      return Response.json({ skipped: true });
    }

    const proposal = data;
    if (!proposal || proposal.status !== 'Aprovada') {
      return Response.json({ skipped: true });
    }

    // Create Job automatically
    const newJob = await base44.asServiceRole.entities.Job.create({
      titulo: proposal.titulo,
      status_kanban: 'Pré-produção',
      proposal_id: proposal.id,
      tenant_id: proposal.tenant_id,
    });

    // Create AccountReceivable automatically
    await base44.asServiceRole.entities.AccountReceivable.create({
      descricao: `Sinal - ${proposal.titulo}`,
      valor: proposal.valor_total || 0,
      status: 'Pendente',
      client_id: proposal.client_id || undefined,
      inquilino_id: proposal.tenant_id,
    });

    return Response.json({ ok: true, job_id: newJob.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});