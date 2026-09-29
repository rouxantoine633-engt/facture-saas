export function LogoMark({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" aria-hidden>
      <defs>
        <linearGradient id="onyxGradLogo" x1="0" y1="0" x2="32" y2="32">
          <stop offset="0%" stopColor="#c9c3ff" />
          <stop offset="55%" stopColor="#8b7cff" />
          <stop offset="100%" stopColor="#3d2fa8" />
        </linearGradient>
      </defs>
      <path d="M16 2 L28 9 V23 L16 30 L4 23 V9 Z" fill="url(#onyxGradLogo)" opacity="0.9" />
      <path d="M16 2 L28 9 L16 16 L4 9 Z" fill="white" opacity="0.25" />
    </svg>
  );
}
