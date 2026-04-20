import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const { email, nomeEmpresa } = await req.json();

  if (!email || !nomeEmpresa) {
    return Response.json({ error: "E-mail e nome da empresa são obrigatórios." }, { status: 400 });
  }

  // Trial expiration: 5 days from now
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 5);
  const trialEndsAtStr = trialEndsAt.toISOString().split("T")[0];

  // 1. Create the Tenant
  const tenant = await base44.asServiceRole.entities.Tenant.create({
    nome_fantasia: nomeEmpresa,
    plan_tier: "Profissional", // full access during trial
    subscription_status: "Trial",
    trial_ends_at: trialEndsAtStr,
  });

  // 2. Create the Usuarios record linked to this tenant
  await base44.asServiceRole.entities.Usuarios.create({
    nome: email.split("@")[0],
    email: email,
    role: "Admin",
    tenant_id: tenant.id,
    perm_comercial: true,
    perm_financeiro: true,
    perm_studio_atividades: true,
    perm_studio_inventario: true,
  });

  // 3. Invite the user to the app (triggers email)
  await base44.users.inviteUser(email, "admin");

  return Response.json({
    ok: true,
    tenantId: tenant.id,
    trialEndsAt: trialEndsAtStr,
  });
});