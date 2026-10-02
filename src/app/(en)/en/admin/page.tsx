import AdminPageHero from "@/components/admin/AdminPageHero";
import type { Lang } from "@/lib/i18n";
import { getContent } from "@/content";
import Icon from "@/components/Icon";

const stats = [
  { label: "Total Registrations", value: "247", icon: "users", tone: "gold", trend: "+12% vs last week" },
  { label: "Pending Review", value: "23", icon: "clock", tone: "orange", trend: "Urgent action needed" },
  { label: "Approved", value: "224", icon: "check", tone: "sky", trend: "+8 today" },
  { label: "Current Round", value: "Round 1", icon: "landmark", tone: "sky", trend: "Ends Nov 1, 2026" },
];

export default function AdminDashboardPage() {
  const lang: Lang = "en";
  const { site } = getContent(lang);

  return (
    <>
      <AdminPageHero
        lang={lang}
        eyebrow={`Season I · 2026 · ${site.name}`}
        title="Dashboard"
        lead="Overview of registration status and operations for IS-NextGen Manager Challenge 2026."
      />

      <section aria-labelledby="stats-heading" className="mb-10">
        <h2 id="stats-heading" className="sr-only">Key Metrics</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <article
              key={stat.label}
              className="card p-6 relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-1"
              style={{
                backgroundImage: `linear-gradient(to right, var(--color-${stat.tone}), var(--color-${stat.tone === "gold" ? "orange" : stat.tone}))`,
              }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[13px] font-semibold tracking-wide text-muted uppercase">{stat.label}</p>
                  <p className="mt-2 text-3xl font-bold text-ink tabular-nums">{stat.value}</p>
                  <p className="mt-1.5 text-[13px] text-muted">{stat.trend}</p>
                </div>
                <Icon name={stat.icon as any} className="h-10 w-10 shrink-0 text-brand/30" strokeWidth={1.5} />
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <section className="card" aria-labelledby="recent-heading">
          <div className="p-6 border-b border-line">
            <div className="flex items-center justify-between">
              <h2 id="recent-heading" className="font-bold text-navy">Recent Registrations</h2>
              <a href="/admin/registrations" className="text-sm font-medium text-brand hover:text-brand/80">
                View all
              </a>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-mist border-b border-line">
                  <th className="px-4 py-3 text-left font-semibold text-navy uppercase tracking-[0.08em] text-[13px]">Candidate</th>
                  <th className="px-4 py-3 text-left font-semibold text-navy uppercase tracking-[0.08em] text-[13px]">University</th>
                  <th className="px-4 py-3 text-left font-semibold text-navy uppercase tracking-[0.08em] text-[13px]">Round</th>
                  <th className="px-4 py-3 text-left font-semibold text-navy uppercase tracking-[0.08em] text-[13px]">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-navy uppercase tracking-[0.08em] text-[13px]">Submitted</th>
                  <th className="px-4 py-3 text-right font-semibold text-navy uppercase tracking-[0.08em] text-[13px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {[
                  { name: "Nguyen Van An", email: "an.nguyen@student.edu.vn", school: "VNU International School", round: "Round 1", status: "pending", date: "Oct 28, 2026" },
                  { name: "Tran Thi Binh", email: "binh.tran@student.edu.vn", school: "Foreign Trade University", round: "Round 1", status: "approved", date: "Oct 27, 2026" },
                  { name: "Le Hoang Cuong", email: "cuong.le@student.edu.vn", school: "Academy of Finance", round: "Round 1", status: "pending", date: "Oct 27, 2026" },
                  { name: "Pham Minh Duc", email: "duc.pham@student.edu.vn", school: "National Economics University", round: "Round 1", status: "rejected", date: "Oct 26, 2026" },
                  { name: "Hoang Thu Ha", email: "ha.hoang@student.edu.vn", school: "University of Economics - VNU", round: "Round 1", status: "approved", date: "Oct 26, 2026" },
                ].map((item, i) => (
                  <tr
                    key={item.email}
                    className={i % 2 === 0 ? "bg-white" : "bg-mist/30 hover:bg-orange/5"}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-ink">{item.name}</div>
                      <div className="text-xs text-muted">{item.email}</div>
                    </td>
                    <td className="px-4 py-3 text-muted">{item.school}</td>
                    <td className="px-4 py-3 text-ink">{item.round}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-[12px] font-medium ${
                          item.status === "pending"
                            ? "bg-orange/10 text-orange-ink"
                            : item.status === "approved"
                            ? "bg-emerald/10 text-emerald-700"
                            : "bg-red/10 text-red-700"
                        }`}
                      >
                        {item.status === "pending" ? "Pending" : item.status === "approved" ? "Approved" : "Rejected"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted">{item.date}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button className="p-2 rounded-xl text-muted hover:text-ink hover:bg-mist transition" aria-label="View details">
                          <Icon name="eye" className="h-4 w-4" />
                        </button>
                        <button className="p-2 rounded-xl text-muted hover:text-brand hover:bg-brand/10 transition" aria-label="Approve">
                          <Icon name="check" className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-4" aria-labelledby="deadlines-heading">
          <h2 id="deadlines-heading" className="font-bold text-navy">Upcoming Deadlines</h2>
          {[
            { label: "Registration Deadline", date: "2026-11-01T23:59:00+07:00", icon: "fileText", tone: "orange" },
            { label: "Qualifying Round", date: "2026-11-22T08:00:00+07:00", icon: "messages", tone: "sky" },
            { label: "Semi-final", date: "2026-12-07T08:00:00+07:00", icon: "inbox", tone: "gold" },
            { label: "Grand Final", date: "2026-12-21T08:00:00+07:00", icon: "trophy", tone: "gold" },
          ].map((d, i) => (
            <article key={d.label} className="card p-4">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center bg-${d.tone}/10`}>
                  <Icon name={d.icon as any} className={`h-5 w-5 text-${d.tone}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-ink truncate">{d.label}</p>
                  <p className="text-sm text-muted">{new Date(d.date).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                </div>
                <Countdown lang="en" deadline={d.date} />
              </div>
            </article>
          ))}
        </section>
      </div>
    </>
  );
}

function Countdown({ lang, deadline }: { lang: "vi" | "en"; deadline: string }) {
  const target = new Date(deadline).getTime();
  const ms = target - Date.now();
  if (ms <= 0) return <span className="text-sm font-semibold text-orange-ink">Closed</span>;
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const parts = d > 0 ? `${d}d` : `${h}h ${m}m`;
  return <span className="text-sm font-mono font-semibold text-ink tabular-nums whitespace-nowrap">{parts}</span>;
}