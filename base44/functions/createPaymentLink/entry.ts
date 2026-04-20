/**
 * CAMADA 2 — Geração de cobrança com spread (Application Fee)
 * Cria um Checkout Session no Stripe para o cliente final, com split automático.
 * Ativa card, boleto e pix.
 * POST { receivableId }
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
const APP_URL = Deno.env.get('APP_URL') || 'https://app.contacena.com.br';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { receivableId } = await req.json();
  if (!receivableId) return Response.json({ error: 'receivableId required' }, { status: 400 });

  // Busca a conta a receber
  const receivables = await base44.asServiceRole.entities.AccountReceivable.filter({ id: receivableId });
  const rec = receivables?.[0];
  if (!rec) return Response.json({ error: 'AccountReceivable not found' }, { status: 404 });

  // Busca o tenant do lançamento
  const tenants = await base44.asServiceRole.entities.Tenant.filter({ id: rec.inquilino_id });
  const tenant = tenants?.[0];
  if (!tenant) return Response.json({ error: 'Tenant not found' }, { status: 404 });

  if (!tenant.stripe_account_id || !tenant.stripe_onboarding_complete) {
    return Response.json({ error: 'Tenant não concluiu o onboarding do Stripe Connect.' }, { status: 422 });
  }

  // Valor em centavos
  const valorCentavos = Math.round(rec.valor * 100);

  // Spread: usa spread_taxa do tenant (configurável pelo Super Admin), padrão 2%
  const spreadTaxa = tenant.spread_taxa ?? 2;
  const applicationFee = Math.round(valorCentavos * (spreadTaxa / 100));

  // Data de vencimento para boleto (mín. 1 dia no futuro)
  const boletoExpiry = rec.data_vencimento
    ? Math.max(Math.floor((new Date(rec.data_vencimento) - Date.now()) / 1000), 86400)
    : 7 * 24 * 3600; // 7 dias

  const session = await stripe.checkout.sessions.create(
    {
      mode: 'payment',
      payment_method_types: ['card', 'boleto', 'pix'],
      line_items: [
        {
          price_data: {
            currency: 'brl',
            unit_amount: valorCentavos,
            product_data: { name: rec.descricao },
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        application_fee_amount: applicationFee,
        metadata: {
          receivable_id: receivableId,
          tenant_id: rec.inquilino_id,
        },
      },
      payment_method_options: {
        boleto: { expires_after_days: Math.ceil(boletoExpiry / 86400) },
        pix:    { expires_after_seconds: 3600 },
      },
      success_url: `${APP_URL}/financeiro?payment=success`,
      cancel_url:  `${APP_URL}/financeiro?payment=cancelled`,
      metadata: {
        receivable_id: receivableId,
        tenant_id: rec.inquilino_id,
      },
    },
    { stripeAccount: tenant.stripe_account_id }
  );

  // Salva o link e session_id na conta a receber
  await base44.asServiceRole.entities.AccountReceivable.update(receivableId, {
    stripe_payment_link:         session.url,
    stripe_checkout_session_id:  session.id,
  });

  return Response.json({ url: session.url, session_id: session.id });
});