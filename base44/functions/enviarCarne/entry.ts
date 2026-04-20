/**
 * Envia o "carnê" (todos os links de cobrança) da proposta para o cliente por e-mail.
 * POST { proposalId }
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { proposalId } = await req.json();
  if (!proposalId) return Response.json({ error: 'proposalId required' }, { status: 400 });

  // Busca todas as parcelas com link gerado
  const tenantId = user.data?.tenant_id;
  const allReceivables = await base44.asServiceRole.entities.AccountReceivable.filter({ inquilino_id: tenantId });
  const parcelas = allReceivables
    .filter(r => r.proposal_id === proposalId && r.stripe_payment_link)
    .sort((a, b) => (a.data_vencimento || '').localeCompare(b.data_vencimento || ''));

  if (parcelas.length === 0) {
    return Response.json({ error: 'Nenhum link de cobrança gerado para esta proposta. Gere as cobranças primeiro.' }, { status: 404 });
  }

  // Busca proposta e cliente
  const proposals = await base44.asServiceRole.entities.Proposal.filter({ id: proposalId });
  const proposal = proposals?.[0];
  const clients = proposal?.client_id
    ? await base44.asServiceRole.entities.Client.filter({ id: proposal.client_id })
    : [];
  const client = clients?.[0];

  if (!client?.contato) {
    return Response.json({ error: 'Cliente sem e-mail de contato cadastrado.' }, { status: 422 });
  }

  const tenants = await base44.asServiceRole.entities.Tenant.filter({ id: tenantId });
  const tenant = tenants?.[0];

  const propNum = proposal?.numero_proposta ? `#${proposal.numero_proposta}` : '';
  const isSingleLink = new Set(parcelas.map(p => p.stripe_payment_link)).size === 1;

  // Monta HTML do e-mail
  let linksHtml;
  if (isSingleLink) {
    linksHtml = `
      <p style="margin-bottom:16px;">Segue o link de pagamento:</p>
      <div style="text-align:center;margin:20px 0;">
        <a href="${parcelas[0].stripe_payment_link}" 
           style="background:#6d28d9;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;">
          Pagar Agora
        </a>
      </div>`;
  } else {
    const rows = parcelas.map((p, i) => `
      <tr style="border-bottom:1px solid #e5e7eb;">
        <td style="padding:10px 14px;color:#374151;">Parcela ${i + 1}/${parcelas.length}</td>
        <td style="padding:10px 14px;color:#374151;">${p.data_vencimento ? new Date(p.data_vencimento + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}</td>
        <td style="padding:10px 14px;color:#374151;">R$ ${p.valor?.toFixed(2).replace('.', ',')}</td>
        <td style="padding:10px 14px;">
          <a href="${p.stripe_payment_link}" 
             style="background:#6d28d9;color:#fff;padding:6px 16px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:600;">
            Pagar
          </a>
        </td>
      </tr>`).join('');

    linksHtml = `
      <p style="margin-bottom:16px;">Segue o carnê com todos os links de pagamento:</p>
      <table style="width:100%;border-collapse:collapse;background:#f9fafb;border-radius:8px;overflow:hidden;">
        <thead>
          <tr style="background:#f3f4f6;">
            <th style="padding:10px 14px;text-align:left;color:#6b7280;font-size:12px;text-transform:uppercase;">Parcela</th>
            <th style="padding:10px 14px;text-align:left;color:#6b7280;font-size:12px;text-transform:uppercase;">Vencimento</th>
            <th style="padding:10px 14px;text-align:left;color:#6b7280;font-size:12px;text-transform:uppercase;">Valor</th>
            <th style="padding:10px 14px;text-align:left;color:#6b7280;font-size:12px;text-transform:uppercase;">Link</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>`;
  }

  const emailBody = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#111827;">
      <div style="background:#6d28d9;padding:24px 32px;border-radius:12px 12px 0 0;">
        <h2 style="color:#fff;margin:0;font-size:20px;">Cobrança ${propNum} — ${tenant?.nome_fantasia || ''}</h2>
      </div>
      <div style="background:#fff;padding:24px 32px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;border-top:none;">
        <p style="color:#374151;">Olá, <strong>${client.nome_fantasia}</strong>!</p>
        ${linksHtml}
        <p style="margin-top:24px;color:#6b7280;font-size:13px;">
          Em caso de dúvidas, entre em contato com ${tenant?.nome_fantasia || 'nossa equipe'}.
        </p>
      </div>
    </div>`;

  await base44.asServiceRole.integrations.Core.SendEmail({
    to: client.contato,
    subject: `Cobrança ${propNum} – ${tenant?.nome_fantasia || ''}`,
    body: emailBody,
    from_name: tenant?.nome_fantasia,
  });

  return Response.json({ ok: true, enviado_para: client.contato, parcelas: parcelas.length });
});