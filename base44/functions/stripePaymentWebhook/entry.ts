/**
 * CAMADA 3 — Webhook de pagamentos dos clientes dos Tenants
 * Ouve checkout.session.completed (card, boleto confirmado, pix confirmado)
 * e dá baixa automática no AccountReceivable.
 *
 * Configure no Stripe Dashboard:
 *   - Evento: checkout.session.completed, payment_intent.succeeded
 *   - URL: <BASE_URL>/stripePaymentWebhook
 *   - Marque "Connect" para receber eventos de contas conectadas
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  const body = await req.text();
  const sig  = req.headers.get('stripe-signature');
  // Para eventos Connect, use um webhook secret específico de "Connect events"
  const webhookSecret = Deno.env.get('STRIPE_PAYMENT_WEBHOOK_SECRET') || Deno.env.get('STRIPE_WEBHOOK_SECRET');

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
  } catch (err) {
    return Response.json({ error: `Webhook signature invalid: ${err.message}` }, { status: 400 });
  }

  const base44 = createClientFromRequest(req);
  const { type, data } = event;

  // checkout.session.completed — pagamento imediato (card) ou pendente (boleto/pix)
  if (type === 'checkout.session.completed') {
    const session = data.object;
    const receivableId = session.metadata?.receivable_id;
    if (!receivableId) return Response.json({ received: true });

    const paymentStatus = session.payment_status; // 'paid' | 'unpaid' | 'no_payment_required'

    if (paymentStatus === 'paid') {
      await darBaixa(base44, receivableId, session.payment_intent, session.payment_method_types?.[0]);
    }
    // boleto/pix ficam como 'unpaid' até confirmação via payment_intent.succeeded
  }

  // payment_intent.succeeded — confirmação final (boleto compensado, pix confirmado)
  else if (type === 'payment_intent.succeeded') {
    const pi = data.object;
    const receivableId = pi.metadata?.receivable_id;
    if (!receivableId) return Response.json({ received: true });

    const method = pi.payment_method_types?.[0] || 'card';
    await darBaixa(base44, receivableId, pi.id, method);
  }

  return Response.json({ received: true });
});

async function darBaixa(base44, receivableId, paymentIntentId, method) {
  const hoje = new Date().toISOString().slice(0, 10);
  await base44.asServiceRole.entities.AccountReceivable.update(receivableId, {
    status: 'Recebido',
    data_pagamento: hoje,
    stripe_payment_intent_id: paymentIntentId || null,
    metodo_pagamento_recebido: method || 'card',
  });
}