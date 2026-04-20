/**
 * CAMADA 1 — Callback pós-onboarding do Stripe Connect
 * Verifica se o account está ativo e salva stripe_onboarding_complete = true.
 * POST { tenantId }
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { tenantId } = await req.json();
  if (!tenantId) return Response.json({ error: 'tenantId required' }, { status: 400 });

  const tenants = await base44.asServiceRole.entities.Tenant.filter({ id: tenantId });
  const tenant = tenants?.[0];
  if (!tenant?.stripe_account_id) return Response.json({ error: 'No Stripe account found' }, { status: 404 });

  const account = await stripe.accounts.retrieve(tenant.stripe_account_id);

  const isComplete = account.details_submitted && !account.requirements?.currently_due?.length;

  if (isComplete) {
    await base44.asServiceRole.entities.Tenant.update(tenantId, {
      stripe_onboarding_complete: true,
    });
  }

  return Response.json({
    complete: isComplete,
    details_submitted: account.details_submitted,
    requirements: account.requirements?.currently_due || [],
  });
});