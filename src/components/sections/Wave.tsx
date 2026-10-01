/** Đường cong chuyển tiếp giữa section sáng và dải tối. */
export default function Wave({ position, className = "text-white" }: { position: "top" | "bottom"; className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 1440 90"
      preserveAspectRatio="none"
      className={`pointer-events-none absolute inset-x-0 z-[1] block h-10 w-full sm:h-16 lg:h-20 ${
        position === "top" ? "top-0" : "bottom-0 rotate-180"
      } ${className}`}
    >
      <path d="M0 0h1440v34c-180 36-420 52-700 30C480 44 240 26 0 56Z" fill="currentColor" />
    </svg>
  );
}
