type Props = { children: React.ReactNode; className?: string; light?: boolean };

/** Nhãn nhỏ màu cam phía trên tiêu đề section, có gạch và mũi tên phía trước. */
export default function Eyebrow({ children, className = "", light }: Props) {
  return (
    <p className={`eyebrow ${light ? "text-gold" : ""} ${className}`}>
      <svg viewBox="0 0 22 10" className="h-2.5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
        <path d="M1 5h18M15 1l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {children}
    </p>
  );
}
