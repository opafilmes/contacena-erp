import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const MASTER_TENANT_ID = Deno.env.get('MASTER_TENANT_ID') || 'master-tenant';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userTenantId = user.data?.tenant_id;

    // Verificação: Se o tenant_id do usuário é o Master mas não é super_admin
    if (userTenantId === MASTER_TENANT_ID && user.role !== 'super_admin') {
      return Response.json(
        { error: 'Acesso negado. Você não tem permissão para acessar dados da empresa Master.' },
        { status: 403 }
      );
    }

    // Verificação: Se o usuário não tem tenant_id atribuído
    if (!userTenantId) {
      return Response.json(
        { error: 'Conta incompleta. Por favor, complete o onboarding.' },
        { status: 403, extra_data: { reason: 'incomplete_onboarding' } }
      );
    }

    // Se passou em todas as verificações, retornar sucesso
    return Response.json({
      allowed: true,
      user_tenant_id: userTenantId,
      user_role: user.role,
    });
  } catch (error) {
    console.error('API Guard error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});