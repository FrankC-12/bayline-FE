"use client";

import { X } from "lucide-react";
import WarrantyClaimForm from "./WarrantyClaimForm";
import type { WarrantyClaimType } from "@/types/warrantyClaim";

interface WarrantyClaimModalProps {
  filialId: string;
  vehicleId: string;
  serviceOrderId: string;
  onClose: () => void;
  /** Proposed from the ODS's applied warranty policy's "Quién cubre" —
   * defaults to "comeback" (the shop investigates) when none applies. */
  initialClaimType?: WarrantyClaimType;
}

export default function WarrantyClaimModal({
  filialId,
  vehicleId,
  serviceOrderId,
  onClose,
  initialClaimType = "comeback",
}: WarrantyClaimModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-navy/40" />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-navy/10 px-6 py-4">
          <h2 className="font-display text-lg font-bold text-navy">Reclamo de garantía</h2>
          <button onClick={onClose} aria-label="Cerrar" className="rounded-lg p-2 text-steel hover:bg-ash hover:text-navy">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6 pt-0">
          <WarrantyClaimForm
            filialId={filialId}
            initialVehicleId={vehicleId}
            initialServiceOrderId={serviceOrderId}
            initialClaimType={initialClaimType}
          />
        </div>
      </div>
    </div>
  );
}
