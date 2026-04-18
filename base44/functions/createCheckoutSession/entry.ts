import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Plan price mapping — replace with your actual Stripe Price IDs
const PRICE_IDS = {
  Essencial: Deno.env.get('STRIPE_PRICE_ESSENCIAL') || 'price_essencial',
  Profissional: Deno.env.get('STRIPE_PRICE_PROFISSIONAL') || 'price_profissional',
};

const APP_URL = Deno.env.get('APP_URL') || 'https://app.contacena.com.br';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { planId, tenantId } = await req.json();

  if (!planId || !tenantId) {
    return Response.json({ error: 'planId and tenantId are required' }, { status: 400 });
  }

  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
  if (!stripeKey) {
    return Response.json({ error: 'Stripe not configured' }, { status: 500 });
  }

  const priceId = PRICE_IDS[planId];
  if (!priceId) return Response.json({ error: 'Invalid plan' }, { status: 400 });

  // Get or create Stripe customer
  const tenants = await base44.asServiceRole.entities.Tenant.filter({ id: tenantId });
  const tenant = tenants?.[0];
  if (!tenant) return Response.json({ error: 'Tenant not found' }, { status: 404 });

  let customerId = tenant.stripe_customer_id;

  if (!customerId) {
    // Create Stripe customer
    const customerRes = await fetch('https://api.stripe.com/v1/customers', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email: user.email,
        name: tenant.nome_fantasia,
        'metadata[tenant_id]': tenantId,
      }),
    });
    const customer = await customerRes.json();
    customerId = customer.id;
    await base44.asServiceRole.entities.Tenant.update(tenantId, { stripe_customer_id: customerId });
  }

  // Create checkout session
  const sessionRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${stripeKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      customer: customerId,
      mode: 'subscription',
      'line_items[0][price]': priceId,
      'line_items[0][quantity]': '1',
      success_url: `${APP_URL}/?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/`,
      'metadata[tenant_id]': tenantId,
      'metadata[plan_tier]': planId,
    }),
  });

  const session = await sessionRes.json();

  if (!session.url) {
    return Response.json({ error: 'Failed to create session', detail: session }, { status: 500 });
  }

  return Response.json({ url: session.url });
});