"use client";
import NewWarrantyClaim from "./NewWarrantyClaim";
import type { WarrantyClaimType } from "@/types/warrantyClaim";
interface Props {
  filialId: string;
  vehicleId: string;
  serviceOrderId: string;
  onClose: () => void;
  initialClaimType?: WarrantyClaimType;
}
export default function WarrantyClaimModal({
  filialId,
  vehicleId,
  serviceOrderId,
  onClose,
}: Props) {
  return (
    <NewWarrantyClaim
      filialId={filialId}
      initialVehicleId={vehicleId}
      initialServiceOrderId={serviceOrderId}
      onClose={onClose}
      onCreated={() => {
        window.dispatchEvent(new Event("bayline:claims-updated"));
        onClose();
      }}
    />
  );
}
