import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import BackButton from "@/components/shared/BackButton";
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
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      <div className="px-8 pt-8 pb-4 max-w-7xl mx-auto w-full">
        <BackButton to="/app/producao" label="← Studio" />
      </div>
      <div className="flex-1 px-8 pb-10 max-w-7xl mx-auto w-full">
        <CallSheetView tenantId={tenantId} clients={clients} />
      </div>
    </div>
  );
}