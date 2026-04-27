import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import CallSheetView from "@/components/producao/CallSheetView";

export default function StudioCallSheet() {
  const { tenant } = useOutletContext();
  const tenantId = tenant?.id;
  const [clients, setClients] = useState([]);

  useEffect(() => {
    if (!tenantId) return;
    base44.entities.Client.filter({ tenant_id: tenantId }).then(setClients);
  }, [tenantId]);

  return (
    <div className="min-h-screen max-w-7xl mx-auto w-full">
      <CallSheetView tenantId={tenantId} clients={clients} />
    </div>
  );
}
