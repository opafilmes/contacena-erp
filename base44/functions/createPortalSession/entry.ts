import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const APP_URL = Deno.env.get('APP_URL') || 'https://app.contacena.com.br';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { tenantId } = await req.json();

  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
  if (!stripeKey) return Response.json({ error: 'Stripe not configured' }, { status: 500 });

  const tenants = await base44.asServiceRole.entities.Tenant.filter({ id: tenantId });
  const tenant = tenants?.[0];
  if (!tenant?.stripe_customer_id) {
    return Response.json({ error: 'No Stripe customer found. Please subscribe first.' }, { status: 400 });
  }

  const portalRes = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${stripeKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      customer: tenant.stripe_customer_id,
      return_url: `${APP_URL}/configuracoes-empresa`,
    }),
  });

  const portal = await portalRes.json();

  if (!portal.url) {
    return Response.json({ error: 'Failed to create portal session', detail: portal }, { status: 500 });
  }

  return Response.json({ url: portal.url });
});