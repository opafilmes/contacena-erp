import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import TopBar from "./TopBar";

const TENANT_ID = "default"; // Single tenant for all users

export default function AppLayout() {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadContext() {
      try {
        const me = await base44.auth.me();

        // Load user's Usuarios record
        const usuarios = await base44.entities.Usuarios.filter({ email: me.email });
        const currentUser = usuarios?.[0];
        setUsuario(currentUser || { nome: me.full_name, email: me.email, role: "user" });

        setLoading(false);
      } catch (err) {
        console.error('Error loading context:', err);
        setLoading(false);
      }
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

  return (
    <div className="min-h-screen bg-background">
      <TopBar usuario={usuario} />
      <main className="pt-16">
        <Outlet context={{ usuario, tenantId: TENANT_ID }} />
      </main>
    </div>
  );
}