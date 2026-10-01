type Props = {
  index: string;
  label: string;
  title: React.ReactNode;
  lead?: React.ReactNode;
  dark?: boolean;
};

export default function SectionHeading({ index, label, title, lead, dark }: Props) {
  return (
    <div className="reveal max-w-3xl">
      <p className={`eyebrow ${dark ? "text-gold" : "text-rust"}`}>
        {index} — {label}
      </p>
      <h2
        className={`mt-3 text-3xl leading-tight font-bold text-balance sm:text-4xl ${dark ? "text-white" : "text-navy"}`}
      >
        {title}
      </h2>
      {lead && <p className={`mt-4 text-base leading-relaxed ${dark ? "text-white/75" : "text-muted"}`}>{lead}</p>}
    </div>
  );
}
