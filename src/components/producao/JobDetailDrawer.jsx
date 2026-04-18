import React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ResumoTab from "./tabs/ResumoTab";
import CallSheetTab from "./tabs/CallSheetTab";
import EquipamentosTab from "./tabs/EquipamentosTab";

export default function JobDetailDrawer({ open, onClose, job, proposal, tenantId }) {
  if (!job) return null;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="bg-popover/95 backdrop-blur-xl border-border/50 w-full sm:max-w-lg flex flex-col"
      >
        <SheetHeader className="pb-4 border-b border-border/30">
          <SheetTitle className="font-heading text-lg truncate">{job.titulo}</SheetTitle>
        </SheetHeader>

        <Tabs defaultValue="resumo" className="flex-1 flex flex-col mt-4 overflow-hidden">
          <TabsList className="bg-muted/40 border border-border/40 w-full">
            <TabsTrigger value="resumo" className="flex-1 text-xs">Resumo</TabsTrigger>
            <TabsTrigger value="callsheet" className="flex-1 text-xs">Call Sheet</TabsTrigger>
            <TabsTrigger value="equipamentos" className="flex-1 text-xs">Equipamentos</TabsTrigger>
          </TabsList>
          <div className="flex-1 overflow-y-auto mt-4 pr-1">
            <TabsContent value="resumo" className="mt-0">
              <ResumoTab job={job} proposal={proposal} />
            </TabsContent>
            <TabsContent value="callsheet" className="mt-0">
              <CallSheetTab job={job} tenantId={tenantId} />
            </TabsContent>
            <TabsContent value="equipamentos" className="mt-0">
              <EquipamentosTab job={job} tenantId={tenantId} />
            </TabsContent>
          </div>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}