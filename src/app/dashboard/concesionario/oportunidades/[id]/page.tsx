"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useModuleAccess } from "@/hooks/useModuleAccess";
import { getOpportunity, type Opportunity } from "@/lib/api/opportunities";
import OpportunityDetailModal from "@/components/concesionario/OpportunityDetailModal";
export default function OpportunityPage() {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const { canEdit } = useModuleAccess("concesionario");
  const router = useRouter();
  const [data, setData] = useState<Opportunity | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    getOpportunity(id)
      .then((v) => {
        if (active) setData(v);
      })
      .catch((e) => {
        if (active)
          setError(
            e instanceof Error
              ? e.message
              : "No se pudo cargar la oportunidad.",
          );
      });
    return () => {
      active = false;
    };
  }, [id]);
  if (error)
    return (
      <p role="alert" className="rounded-xl bg-red-50 p-5 text-red-700">
        {error}
      </p>
    );
  if (!data || !currentUser?.filialId)
    return <p role="status">Cargando oportunidad…</p>;
  return (
    <OpportunityDetailModal
      fullPage
      initial={data}
      filialId={currentUser.filialId}
      canEdit={canEdit}
      onClose={() => router.push("/dashboard/concesionario/oportunidades")}
      onChanged={() => undefined}
    />
  );
}
