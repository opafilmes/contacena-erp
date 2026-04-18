import React, { useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Plus, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import BackButton from "@/components/shared/BackButton";
import EquipmentTable from "@/components/studio/EquipmentTable";
import EquipmentDrawer from "@/components/studio/EquipmentDrawer";
import BookingDrawer from "@/components/studio/BookingDrawer";
import BookingTable from "@/components/studio/BookingTable";

export default function StudioInventario() {
  const { tenant } = useOutletContext();
  const tenantId = tenant?.id;

  const [equipments, setEquipments] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [eqDrawer, setEqDrawer] = useState({ open: false, record: null });
  const [bkDrawer, setBkDrawer] = useState({ open: false, record: null });
  const [tab, setTab] = useState("equipamentos");

  const loadAll = useCallback(async () => {
    if (!tenantId) return;
    const [eq, bk, j] = await Promise.all([
      base44.entities.Equipment.filter({ tenant_id: tenantId }),
      base44.entities.EquipmentBooking.filter({ inquilino_id: tenantId }),
      base44.entities.Job.filter({ tenant_id: tenantId }),
    ]);
    setEquipments(eq);
    setBookings(bk);
    setJobs(j);
  }, [tenantId]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleDeleteEq = async (eq) => {
    await base44.entities.Equipment.delete(eq.id);
    loadAll();
  };

  const handleDeleteBk = async (bk) => {
    await base44.entities.EquipmentBooking.delete(bk.id);
    loadAll();
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] px-6 py-10 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <BackButton to="/producao" label="← Studio" />

        <div className="flex items-center justify-between mt-4 mb-8">
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground tracking-tight">🎥 Inventário de Equipamentos</h1>
            <p className="text-muted-foreground text-sm mt-1">Ativos, reservas e controle de conflitos</p>
          </div>
          <div className="flex gap-2">
            {tab === "equipamentos" ? (
              <Button onClick={() => setEqDrawer({ open: true, record: null })} size="sm" className="gap-2">
                <Plus className="w-4 h-4" /> Novo Equipamento
              </Button>
            ) : (
              <Button onClick={() => setBkDrawer({ open: true, record: null })} size="sm" className="gap-2">
                <Plus className="w-4 h-4" /> Nova Reserva
              </Button>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="rounded-xl border border-violet-500/20 bg-violet-500/10 p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-white/[0.05] text-violet-400">
              <Package className="w-5 h-5 stroke-[1.5]" />
            </div>
            <div>
              <p className="text-2xl font-heading font-bold text-violet-400">{equipments.length}</p>
              <p className="text-xs text-muted-foreground">Equipamentos Cadastrados</p>
            </div>
          </div>
          <div className="rounded-xl border border-sky-500/20 bg-sky-500/10 p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-white/[0.05] text-sky-400">
              <Plus className="w-5 h-5 stroke-[1.5]" />
            </div>
            <div>
              <p className="text-2xl font-heading font-bold text-sky-400">{bookings.length}</p>
              <p className="text-xs text-muted-foreground">Reservas Ativas</p>
            </div>
          </div>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-6 bg-secondary/50">
            <TabsTrigger value="equipamentos">Equipamentos</TabsTrigger>
            <TabsTrigger value="reservas">Reservas</TabsTrigger>
          </TabsList>

          <TabsContent value="equipamentos">
            <EquipmentTable
              equipments={equipments}
              onEdit={(eq) => setEqDrawer({ open: true, record: eq })}
              onDelete={handleDeleteEq}
            />
          </TabsContent>

          <TabsContent value="reservas">
            <BookingTable
              bookings={bookings}
              equipments={equipments}
              jobs={jobs}
              onEdit={(bk) => setBkDrawer({ open: true, record: bk })}
              onDelete={handleDeleteBk}
            />
          </TabsContent>
        </Tabs>
      </motion.div>

      <EquipmentDrawer
        open={eqDrawer.open}
        record={eqDrawer.record}
        tenantId={tenantId}
        onClose={() => setEqDrawer({ open: false, record: null })}
        onSaved={loadAll}
      />

      <BookingDrawer
        open={bkDrawer.open}
        record={bkDrawer.record}
        inquilinoId={tenantId}
        equipments={equipments}
        jobs={jobs}
        onClose={() => setBkDrawer({ open: false, record: null })}
        onSaved={loadAll}
      />
    </div>
  );
}