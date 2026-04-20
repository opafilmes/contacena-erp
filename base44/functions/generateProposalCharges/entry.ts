/**
 * Gera Checkout Sessions Stripe para todas as parcelas de uma proposta.
 * POST { proposalId, paymentMethod: "boleto" | "pix" | "card" }
 * 
 * - boleto/pix: cria uma Session por parcela individualmente
 * - card: cria uma Session única com o total e marca todas as parcelas como pagas
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
const APP_URL = Deno.env.get('APP_URL') || 'https://app.contacena.com.br';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { proposalId, paymentMethod = 'boleto' } = await req.json();
  if (!proposalId) return Response.json({ error: 'proposalId required' }, { status: 400 });

  // Busca todas as parcelas vinculadas a esta proposta
  const allReceivables = await base44.asServiceRole.entities.AccountReceivable.filter({ inquilino_id: user.data?.tenant_id || '' });
  const parcelas = allReceivables.filter(r => r.proposal_id === proposalId && r.status !== 'Recebido');

  if (parcelas.length === 0) {
    return Response.json({ error: 'Nenhuma parcela pendente encontrada para esta proposta.' }, { status: 404 });
  }

  // Busca o tenant pelo primeiro lançamento
  const tenantId = parcelas[0].inquilino_id;
  const tenants = await base44.asServiceRole.entities.Tenant.filter({ id: tenantId });
  const tenant = tenants?.[0];

  if (!tenant?.stripe_account_id || !tenant?.stripe_onboarding_complete) {
    return Response.json({ error: 'Tenant não concluiu o onboarding do Stripe Connect.' }, { status: 422 });
  }

  const spreadTaxa = tenant.spread_taxa ?? 2;
  const stripeAccount = tenant.stripe_account_id;

  // Busca dados da proposta para obter o nome do cliente
  const proposals = await base44.asServiceRole.entities.Proposal.filter({ id: proposalId });
  const proposal = proposals?.[0];
  const clients = proposal?.client_id
    ? await base44.asServiceRole.entities.Client.filter({ id: proposal.client_id })
    : [];
  const clienteNome = clients?.[0]?.nome_fantasia || 'Cliente';

  const results = [];

  if (paymentMethod === 'card') {
    // CARTÃO: Session única com valor total + parcelamento nativo Stripe Brasil
    const totalCentavos = Math.round(parcelas.reduce((s, p) => s + p.valor, 0) * 100);
    const applicationFee = Math.round(totalCentavos * (spreadTaxa / 100));
    const qtd = parcelas.length;

    const session = await stripe.checkout.sessions.create(
      {
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'brl',
            unit_amount: totalCentavos,
            product_data: { name: `${clienteNome} – Proposta (${qtd}x)` },
          },
          quantity: 1,
        }],
        payment_intent_data: {
          application_fee_amount: applicationFee,
          payment_method_options: {
            card: {
              installments: { enabled: true },
            },
          },
          metadata: { proposal_id: proposalId, tenant_id: tenantId },
        },
        success_url: `${APP_URL}/financeiro?payment=success`,
        cancel_url:  `${APP_URL}/financeiro?payment=cancelled`,
        metadata: { proposal_id: proposalId, tenant_id: tenantId },
      },
      { stripeAccount }
    );

    // Atualiza todas as parcelas com o mesmo link
    await Promise.all(parcelas.map(p =>
      base44.asServiceRole.entities.AccountReceivable.update(p.id, {
        stripe_payment_link: session.url,
        stripe_checkout_session_id: session.id,
      })
    ));

    results.push({ parcela: 'total', url: session.url, session_id: session.id });

  } else {
    // BOLETO / PIX: Session individual por parcela
    for (const parcela of parcelas) {
      const valorCentavos = Math.round(parcela.valor * 100);
      const applicationFee = Math.round(valorCentavos * (spreadTaxa / 100));

      const boletoExpiry = parcela.data_vencimento
        ? Math.max(Math.ceil((new Date(parcela.data_vencimento) - Date.now()) / 86400000), 1)
        : 7;

      const paymentMethods = paymentMethod === 'pix' ? ['pix'] : ['boleto'];

      const session = await stripe.checkout.sessions.create(
        {
          mode: 'payment',
          payment_method_types: paymentMethods,
          line_items: [{
            price_data: {
              currency: 'brl',
              unit_amount: valorCentavos,
              product_data: { name: parcela.descricao },
            },
            quantity: 1,
          }],
          payment_intent_data: {
            application_fee_amount: applicationFee,
            metadata: {
              receivable_id: parcela.id,
              proposal_id: proposalId,
              tenant_id: tenantId,
            },
          },
          payment_method_options: paymentMethod === 'boleto'
            ? { boleto: { expires_after_days: boletoExpiry } }
            : { pix: { expires_after_seconds: 3600 } },
          success_url: `${APP_URL}/financeiro?payment=success`,
          cancel_url:  `${APP_URL}/financeiro?payment=cancelled`,
          metadata: { receivable_id: parcela.id, proposal_id: proposalId, tenant_id: tenantId },
        },
        { stripeAccount }
      );

      await base44.asServiceRole.entities.AccountReceivable.update(parcela.id, {
        stripe_payment_link: session.url,
        stripe_checkout_session_id: session.id,
      });

      results.push({ parcela: parcela.descricao, url: session.url, session_id: session.id });
    }
  }

  return Response.json({ ok: true, charges: results, total: results.length });
});