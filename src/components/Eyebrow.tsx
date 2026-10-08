type Props = { children: React.ReactNode; className?: string; light?: boolean };

/** Nhãn nhỏ phía trên tiêu đề section, có một gạch ngắn phía trước. */
export default function Eyebrow({ children, className = "", light }: Props) {
  return (
    <p className={`eyebrow ${light ? "text-gold" : ""} ${className}`}>
      <span aria-hidden className="h-px w-8 shrink-0 bg-current" />
      {children}
    </p>
  );
}
