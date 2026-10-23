"use client";
import { useState } from "react";
import Image from "next/image";
import { Camera, FileText, ExternalLink } from "lucide-react";
import { evidenceUrl, imageEvidence } from "@/lib/evidence";
function Evidence({
  url,
  label,
  image,
}: {
  url: string;
  label: string;
  image: boolean;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="group overflow-hidden rounded-xl border border-navy/10 bg-white"
    >
      {image && !failed ? (
        <Image
          unoptimized
          src={url}
          width={640}
          height={400}
          alt={label}
          onError={() => setFailed(true)}
          className="h-40 w-full bg-slate-50 object-contain"
        />
      ) : (
        <div className="flex h-24 items-center justify-center bg-slate-50 text-steel">
          <FileText className="h-8 w-8" />
        </div>
      )}
      <span className="flex items-center justify-between gap-2 p-3 text-xs font-semibold text-blue">
        <span className="truncate">{label}</span>
        <ExternalLink className="h-3 w-3 shrink-0" />
      </span>
      {failed && (
        <span className="block px-3 pb-3 text-xs text-steel">
          No se pudo cargar la vista previa. Abre el archivo para consultarlo.
        </span>
      )}
    </a>
  );
}
export default function EvidenceGallery({
  files,
  title = "Evidencias",
}: {
  files: { url: string; filename?: string }[];
  title?: string;
}) {
  const seen = new Set<string>();
  const valid = files.flatMap((file) => {
    const url = evidenceUrl(file.url);
    if (!url || seen.has(url)) return [];
    seen.add(url);
    return [{ ...file, url }];
  });
  return (
    <section className="space-y-3">
      <h3 className="flex items-center gap-2 font-semibold text-navy">
        <Camera className="h-4 w-4" />
        {title} · {valid.length}
      </h3>
      {valid.length ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {valid.map((file, i) => (
            <Evidence
              key={file.url}
              url={file.url}
              label={file.filename || `Foto ${i + 1}`}
              image={!file.filename || imageEvidence(file.url, file.filename)}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-steel">
          No se han adjuntado archivos a esta inspección.
        </p>
      )}
    </section>
  );
}
