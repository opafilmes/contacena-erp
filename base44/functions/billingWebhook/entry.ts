import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  const body = await req.text();
  const sig  = req.headers.get('stripe-signature');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
  } catch (err) {
    return Response.json({ error: `Webhook signature invalid: ${err.message}` }, { status: 400 });
  }

  const base44 = createClientFromRequest(req);

  // Helper to find tenant by stripe_customer_id
  const getTenant = async (customerId) => {
    const all = await base44.asServiceRole.entities.Tenant.filter({ stripe_customer_id: customerId });
    return all?.[0] || null;
  };

  const { type, data } = event;

  if (type === 'checkout.session.completed') {
    const session = data.object;
    const tenantId  = session.metadata?.tenant_id;
    const planTier  = session.metadata?.plan_tier;
    const customerId = session.customer;

    if (!tenantId) return Response.json({ message: 'No tenant_id in metadata' });

    await base44.asServiceRole.entities.Tenant.update(tenantId, {
      stripe_customer_id:  customerId,
      plan_tier:           planTier || 'Essencial',
      subscription_status: 'Active',
    });
  }

  else if (type === 'invoice.paid') {
    const invoice    = data.object;
    const customerId = invoice.customer;
    const tenant     = await getTenant(customerId);
    if (tenant) {
      await base44.asServiceRole.entities.Tenant.update(tenant.id, {
        subscription_status: 'Active',
      });
    }
  }

  else if (type === 'invoice.payment_failed') {
    const invoice    = data.object;
    const customerId = invoice.customer;
    const tenant     = await getTenant(customerId);
    if (tenant) {
      await base44.asServiceRole.entities.Tenant.update(tenant.id, {
        subscription_status: 'Past_Due',
      });
    }
  }

  else if (type === 'customer.subscription.updated') {
    const sub        = data.object;
    const customerId = sub.customer;
    const tenant     = await getTenant(customerId);
    if (tenant) {
      const status = sub.status === 'active' ? 'Active'
                   : sub.status === 'past_due' ? 'Past_Due'
                   : sub.status === 'canceled' ? 'Canceled'
                   : tenant.subscription_status;
      await base44.asServiceRole.entities.Tenant.update(tenant.id, { subscription_status: status });
    }
  }

  else if (type === 'customer.subscription.deleted') {
    const sub        = data.object;
    const customerId = sub.customer;
    const tenant     = await getTenant(customerId);
    if (tenant) {
      await base44.asServiceRole.entities.Tenant.update(tenant.id, {
        subscription_status: 'Canceled',
      });
    }
  }

  return Response.json({ received: true });
});