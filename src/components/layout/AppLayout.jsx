import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import TopBar from "./TopBar";
import EscolhaPlano from "@/pages/EscolhaPlano";

export default function AppLayout() {
  const [tenant, setTenant] = useState(null);
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadContext() {
      const me = await base44.auth.me();

      // Try to find user's Usuarios record
      const usuarios = await base44.entities.Usuarios.filter({ email: me.email });
      const currentUser = usuarios?.[0];
      setUsuario(currentUser || { nome: me.full_name, email: me.email, role: me.role || "Admin" });

      // Load tenant if user has tenant_id
      if (currentUser?.tenant_id) {
        const tenants = await base44.entities.Tenant.filter({ id: currentUser.tenant_id });
        if (tenants?.[0]) setTenant(tenants[0]);
      } else {
        // Fallback: load first tenant the user created
        const allTenants = await base44.entities.Tenant.list("-created_date", 1);
        if (allTenants?.[0]) setTenant(allTenants[0]);
      }

      setLoading(false);
    }
    loadContext();
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm font-body">Carregando...</p>
        </div>
      </div>
    );
  }

  // Paywall: trial expired
  const isTrialExpired = (() => {
    if (!tenant) return false;
    if (tenant.subscription_status !== 'Trial') return false;
    if (!tenant.trial_ends_at) return false;
    return new Date() > new Date(tenant.trial_ends_at);
  })();

  if (isTrialExpired) {
    return <EscolhaPlano tenant={tenant} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <TopBar tenant={tenant} usuario={usuario} tenantId={tenant?.id} />
      <main className="pt-16">
        <Outlet context={{ tenant, usuario }} />
      </main>
    </div>
  );
}