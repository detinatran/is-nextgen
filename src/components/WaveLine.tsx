/** Hai đường lượn mảnh dùng làm vạch ngăn giữa các section. */
export default function WaveLine({ flip = false, className = "" }: { flip?: boolean; className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 1440 60"
      preserveAspectRatio="none"
      className={`pointer-events-none block h-10 w-full sm:h-14 ${flip ? "-scale-y-100" : ""} ${className}`}
      fill="none"
    >
      <path d="M0 38 C 240 6, 480 6, 720 30 S 1200 58, 1440 22" stroke="var(--color-navy)" strokeOpacity="0.18" strokeWidth="1.5" />
      <path d="M0 46 C 260 18, 520 16, 760 38 S 1220 60, 1440 32" stroke="var(--color-orange)" strokeOpacity="0.55" strokeWidth="1.5" />
    </svg>
  );
}
