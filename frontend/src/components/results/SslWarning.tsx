import { cn } from '../../lib/cn';
import type { TlsInfo } from '../../types';

interface SslWarningProps {
  tls: TlsInfo;
}

export function SslWarning({ tls }: SslWarningProps) {
  const cert = tls.certificate;
  if (!cert || (!cert.expired && cert.expiresInDays >= 30)) return null;

  const expired = cert.expired;
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-5 py-4 rounded-xl mb-6 animate-fade-in-up",
        expired ? "bg-red-500/10 border border-red-500/20" : "bg-yellow-500/10 border border-yellow-500/20"
      )}
    >
      <div className={cn("w-1 h-7 rounded-sm", expired ? "bg-[var(--color-accent-red)]" : "bg-[var(--color-accent-yellow)]")} />
      <div>
        <strong className={cn("block", expired ? "text-[var(--color-accent-red)]" : "text-[var(--color-accent-yellow)]")}>
          {expired ? 'Certificado TLS EXPIRADO' : `Certificado próximo a expirar (${cert.expiresInDays} días)`}
        </strong>
        <span className="text-sm text-slate-400">
          {expired
            ? `Expiró el ${cert.validTo}. Debe renovarse inmediatamente.`
            : `Expira el ${cert.validTo}. Renueve antes de la fecha de vencimiento.`}
        </span>
      </div>
    </div>
  );
}
