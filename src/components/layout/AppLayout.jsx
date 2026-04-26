import React, { useState, useEffect } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import EscolhaPlano from "@/pages/EscolhaPlano";
import SidebarDinamica from "./SidebarDinamica";
import { AppModeProvider, useAppMode } from "@/lib/AppModeContext";

function AppShell({ tenant, usuario }) {
  const { appMode } = useAppMode();

  return (
    <div className="min-h-screen bg-background flex">
      <SidebarDinamica tenant={tenant} usuario={usuario} />
      <main className="flex-1 ml-60 min-h-screen overflow-y-auto">
        <div className="px-8 py-8">
          <Outlet context={{ tenant, usuario, appMode }} />
        </div>
      </main>
    </div>
  );
}

export default function AppLayout() {
  const [tenant, setTenant] = useState(null);
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadContext() {
      const me = await base44.auth.me();
      const usuarios = await base44.entities.Usuarios.filter({ email: me.email });
      const currentUser = usuarios?.[0];
      setUsuario(currentUser || { nome: me.full_name, email: me.email, role: me.role || "Admin" });

      if (currentUser?.tenant_id) {
        const tenants = await base44.entities.Tenant.filter({ id: currentUser.tenant_id });
        if (tenants?.[0]) setTenant(tenants[0]);
      } else {
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
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm font-body">Carregando...</p>
        </div>
      </div>
    );
  }

  const isTrialExpired = (() => {
    if (!tenant) return false;
    if (tenant.subscription_status !== "Trial") return false;
    if (!tenant.trial_ends_at) return false;
    return new Date() > new Date(tenant.trial_ends_at);
  })();

  if (isTrialExpired) return <EscolhaPlano tenant={tenant} />;

  return (
    <AppModeProvider usuario={usuario}>
      <AppShell tenant={tenant} usuario={usuario} />
    </AppModeProvider>
  );
}