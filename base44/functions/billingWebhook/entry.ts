import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  // Only accept POST
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  const body = await req.json();
  const base44 = createClientFromRequest(req);

  // Validate shared secret to ensure this is a trusted source
  const secret = req.headers.get('x-webhook-secret');
  const expectedSecret = Deno.env.get('BILLING_WEBHOOK_SECRET');
  if (expectedSecret && secret !== expectedSecret) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { event_type, tenant_id, plan_tier, stripe_customer_id } = body;

  if (!tenant_id) {
    return Response.json({ error: 'Missing tenant_id' }, { status: 400 });
  }

  const validEvents = ['payment_success', 'subscription_updated', 'subscription_canceled', 'payment_failed'];
  if (!validEvents.includes(event_type)) {
    return Response.json({ message: 'Event ignored' }, { status: 200 });
  }

  const tenants = await base44.asServiceRole.entities.Tenant.filter({ id: tenant_id });
  if (!tenants?.[0]) {
    return Response.json({ error: 'Tenant not found' }, { status: 404 });
  }

  const tenant = tenants[0];
  let updatePayload = {};

  if (event_type === 'payment_success' || event_type === 'subscription_updated') {
    updatePayload = {
      plan_tier: plan_tier || tenant.plan_tier,
      subscription_status: 'Active',
    };
    if (stripe_customer_id) updatePayload.stripe_customer_id = stripe_customer_id;
  } else if (event_type === 'subscription_canceled') {
    updatePayload = { subscription_status: 'Canceled' };
  } else if (event_type === 'payment_failed') {
    updatePayload = { subscription_status: 'Past_Due' };
  }

  await base44.asServiceRole.entities.Tenant.update(tenant.id, updatePayload);

  return Response.json({ success: true, updated: updatePayload });
});