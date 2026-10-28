"use client";

import { useEffect, useState } from "react";
import BankIdentity from "@/components/common/BankIdentity";
import Modal from "@/components/common/Modal";
import { useModuleAccess } from "@/hooks/useModuleAccess";
import { Loader2 } from "lucide-react";
import { getSupplier, updateSupplier } from "@/lib/api/administracion";
import {
  capitalizeFirst,
  formatMoney,
  formatVenezuelanPhone,
} from "@/lib/format";
import type { Supplier, SupplierDetail } from "@/types/administracion";

interface Props {
  supplier: Supplier | null;
  onClose: () => void;
  onUpdated: (supplier: Supplier) => void;
}

export default function SupplierDetailDrawer({
  supplier,
  onClose,
  onUpdated,
}: Props) {
  const [detail, setDetail] = useState<SupplierDetail | null>(null);
  const { canEdit } = useModuleAccess("compras");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    setDetail(null);
    setLoadError(null);
    if (supplier)
      void getSupplier(supplier.id)
        .then((data) => {
          if (active) setDetail(data);
        })
        .catch((error) => {
          if (active)
            setLoadError(
              error instanceof Error
                ? error.message
                : "No se pudo cargar el proveedor.",
            );
        });
    return () => {
      active = false;
    };
  }, [supplier]);

  if (!supplier) return null;

  async function toggleStatus() {
    if (!detail || !canEdit || saving) return;
    setSaving(true);
    try {
      const updated = await updateSupplier(detail.id, {
        status: detail.status === "activo" ? "inactivo" : "activo",
      });
      setDetail((current) =>
        current ? { ...current, status: updated.status } : current,
      );
      onUpdated(updated);
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "No se pudo actualizar el proveedor.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={supplier.business_name}
      description="Información del proveedor, cuentas e historial de compras."
      size="lg"
      closeDisabled={saving}
    >
      {loadError && (
        <p
          role="alert"
          className="mx-5 mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700"
        >
          {loadError}
        </p>
      )}
      {!detail ? (
        loadError ? (
          <button
            type="button"
            onClick={onClose}
            className="m-5 rounded-full border border-navy/15 px-4 py-2 text-sm text-navy"
          >
            Cerrar
          </button>
        ) : (
          <div className="flex justify-center p-16">
            <Loader2 className="h-6 w-6 animate-spin text-blue" />
          </div>
        )
      ) : (
        <div className="space-y-7 p-5 sm:p-7">
          <section className="rounded-2xl border border-navy/10 p-5">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h3 className="font-semibold text-navy">Información general</h3>
              {canEdit && (
                <button
                  disabled={saving}
                  onClick={toggleStatus}
                  className={`rounded-full px-4 py-2 text-xs font-semibold ${detail.status === "activo" ? "bg-red-50 text-red-700" : "bg-emerald-100 text-emerald-700"}`}
                >
                  {saving
                    ? "Guardando..."
                    : detail.status === "activo"
                      ? "Desactivar proveedor"
                      : "Activar proveedor"}
                </button>
              )}
            </div>
            <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-steel">RIF</dt>
                <dd className="font-medium text-navy">{detail.rif}</dd>
              </div>
              <div>
                <dt className="text-steel">Nombre comercial</dt>
                <dd className="font-medium text-navy">
                  {detail.trade_name ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-steel">Contacto</dt>
                <dd className="font-medium text-navy">
                  {detail.contact_person ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-steel">Teléfono</dt>
                <dd className="font-medium text-navy">
                  {detail.phone ? formatVenezuelanPhone(detail.phone) : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-steel">Correo</dt>
                <dd className="font-medium text-navy">{detail.email ?? "—"}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-steel">Ubicación / dirección</dt>
                <dd className="font-medium text-navy">
                  {detail.address ?? "—"}
                </dd>
              </div>
            </dl>
          </section>
          <section>
            <h3 className="mb-3 font-semibold text-navy">
              Cuentas y métodos de pago
            </h3>
            {detail.payment_accounts.length === 0 ? (
              <p className="rounded-xl bg-ash p-4 text-sm text-steel">
                No hay cuentas registradas.
              </p>
            ) : (
              <div className="grid gap-3">
                {detail.payment_accounts.map((account, index) => (
                  <div
                    key={account.id ?? index}
                    className="rounded-xl border border-navy/10 p-4 text-sm"
                  >
                    <div className="flex justify-between">
                      <strong className="text-navy">
                        {capitalizeFirst(
                          account.payment_method.replace("_", " "),
                        )}
                      </strong>
                      <span className="uppercase text-steel">
                        {account.currency}
                      </span>
                    </div>
                    {account.bank_name && (
                      <div className="mt-3">
                        <BankIdentity name={account.bank_name} />
                      </div>
                    )}
                    <p className="mt-2 text-steel">
                      {account.bank_name ?? "Sin banco"} ·{" "}
                      {account.account_holder}
                    </p>
                    <p className="font-mono text-navy">
                      {account.account_number ??
                        account.email ??
                        account.phone ??
                        "Sin identificador"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
          <section>
            <h3 className="mb-3 font-semibold text-navy">
              Historial de compras
            </h3>
            {detail.purchase_history.length === 0 ? (
              <p className="rounded-xl bg-ash p-4 text-sm text-steel">
                Todavía no hay compras a este proveedor.
              </p>
            ) : (
              <div className="overflow-hidden rounded-xl border border-navy/10">
                <table className="w-full text-left text-sm">
                  <thead className="bg-ash text-steel">
                    <tr>
                      <th className="px-4 py-3">Solicitud</th>
                      <th className="px-4 py-3">Fecha</th>
                      <th className="px-4 py-3">Estado</th>
                      <th className="px-4 py-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy/5">
                    {detail.purchase_history.map((purchase) => (
                      <tr key={purchase.id}>
                        <td className="px-4 py-3 font-mono text-blue">
                          {purchase.code}
                        </td>
                        <td className="px-4 py-3">
                          {new Date(purchase.created_at).toLocaleDateString(
                            "es-VE",
                          )}
                        </td>
                        <td className="px-4 py-3 capitalize">
                          {purchase.status}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {purchase.total_quoted == null
                            ? "—"
                            : `$${formatMoney(purchase.total_quoted)}`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </Modal>
  );
}
