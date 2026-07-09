/**
 * Isotipo de FERRETODO: tuerca hexagonal naranja con la "F".
 * La misma forma vive en app/icon.svg (favicon de la pestaña) — si se cambia
 * una, actualizar la otra. El tamaño se controla por className (h-* w-*).
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <path
        d="M32 4 L56.25 18 V46 L32 60 L7.75 46 V18 Z"
        fill="#f25c05"
        stroke="#f25c05"
        strokeWidth="6"
        strokeLinejoin="round"
      />
      <g fill="#ffffff">
        <rect x="23" y="19" width="7" height="27" rx="1.5" />
        <rect x="23" y="19" width="18" height="7" rx="1.5" />
        <rect x="23" y="31.5" width="14" height="6" rx="1.5" />
      </g>
    </svg>
  );
}
