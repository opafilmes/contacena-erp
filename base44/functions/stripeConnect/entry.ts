/**
 * CAMADA 1 — Stripe Connect Express Onboarding
 * Gera um account_link para o Tenant realizar o onboarding no Stripe Connect.
 * POST { tenantId }
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
const APP_URL = Deno.env.get('APP_URL') || 'https://app.contacena.com.br';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { tenantId } = await req.json();
  if (!tenantId) return Response.json({ error: 'tenantId required' }, { status: 400 });

  const tenants = await base44.asServiceRole.entities.Tenant.filter({ id: tenantId });
  const tenant = tenants?.[0];
  if (!tenant) return Response.json({ error: 'Tenant not found' }, { status: 404 });

  let accountId = tenant.stripe_account_id;

  // Cria conta Express se ainda não existir
  if (!accountId) {
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'BR',
      email: tenant.email_corporativo || user.email,
      business_profile: {
        name: tenant.nome_fantasia,
      },
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
        boleto_payments: { requested: true },
        pix_payments: { requested: true },
      },
      metadata: { tenant_id: tenantId },
    });
    accountId = account.id;
    await base44.asServiceRole.entities.Tenant.update(tenantId, {
      stripe_account_id: accountId,
      stripe_onboarding_complete: false,
    });
  }

  // Gera link de onboarding
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${APP_URL}/configuracoes-empresa?stripe=refresh`,
    return_url:  `${APP_URL}/configuracoes-empresa?stripe=success&tenantId=${tenantId}`,
    type: 'account_onboarding',
  });

  return Response.json({ url: accountLink.url });
});