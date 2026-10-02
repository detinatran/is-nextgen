import AdminPageHero from "@/components/admin/AdminPageHero";
import type { Lang } from "@/lib/i18n";
import { getContent } from "@/content";
import Icon from "@/components/Icon";

const stats = [
  { label: "Tổng đăng ký", value: "247", icon: "users", tone: "gold", trend: "+12% so với tuần trước" },
  { label: "Đang chờ duyệt", value: "23", icon: "clock", tone: "orange", trend: "Cần xử lý gấp" },
  { label: "Đã duyệt", value: "224", icon: "check", tone: "sky", trend: "+8 hôm nay" },
  { label: "Vòng hiện tại", value: "Vòng 1", icon: "landmark", tone: "sky", trend: "Kết thúc 01/11/2026" },
];

export default function AdminDashboardPage() {
  const lang: Lang = "vi";
  const { site } = getContent(lang);

  return (
    <>
      <AdminPageHero
        lang={lang}
        eyebrow={`Mùa I · 2026 · ${site.name}`}
        title="Bảng điều khiển"
        lead="Tổng quan tình hình đăng ký và vận hành cuộc thi IS-NextGen Manager Challenge 2026."
      />

      <section aria-labelledby="stats-heading" className="mb-10">
        <h2 id="stats-heading" className="sr-only">Chỉ số chính</h2>
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
              <h2 id="recent-heading" className="font-bold text-navy">Đơn đăng ký gần đây</h2>
              <a href="/admin/registrations" className="text-sm font-medium text-brand hover:text-brand/80">
                Xem tất cả
              </a>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-mist border-b border-line">
                  <th className="px-4 py-3 text-left font-semibold text-navy uppercase tracking-[0.08em] text-[13px]">Thí sinh</th>
                  <th className="px-4 py-3 text-left font-semibold text-navy uppercase tracking-[0.08em] text-[13px]">Trường</th>
                  <th className="px-4 py-3 text-left font-semibold text-navy uppercase tracking-[0.08em] text-[13px]">Vòng</th>
                  <th className="px-4 py-3 text-left font-semibold text-navy uppercase tracking-[0.08em] text-[13px]">Trạng thái</th>
                  <th className="px-4 py-3 text-left font-semibold text-navy uppercase tracking-[0.08em] text-[13px]">Ngày nộp</th>
                  <th className="px-4 py-3 text-right font-semibold text-navy uppercase tracking-[0.08em] text-[13px]">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {[
                  { name: "Nguyễn Văn An", email: "an.nguyen@student.edu.vn", school: "Trường Quốc tế - ĐHQGHN", round: "Vòng 1", status: "pending", date: "28/10/2026" },
                  { name: "Trần Thị Bình", email: "binh.tran@student.edu.vn", school: "ĐH Ngoại thương", round: "Vòng 1", status: "approved", date: "27/10/2026" },
                  { name: "Lê Hoàng Cường", email: "cuong.le@student.edu.vn", school: "Học viện Tài chính", round: "Vòng 1", status: "pending", date: "27/10/2026" },
                  { name: "Phạm Minh Đức", email: "duc.pham@student.edu.vn", school: "ĐH Kinh tế Quốc dân", round: "Vòng 1", status: "rejected", date: "26/10/2026" },
                  { name: "Hoàng Thu Hà", email: "ha.hoang@student.edu.vn", school: "Trường Đại học Kinh tế - ĐHQGHN", round: "Vòng 1", status: "approved", date: "26/10/2026" },
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
                        {item.status === "pending" ? "Chờ duyệt" : item.status === "approved" ? "Đã duyệt" : "Từ chối"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted">{item.date}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button className="p-2 rounded-xl text-muted hover:text-ink hover:bg-mist transition" aria-label="Xem chi tiết">
                          <Icon name="eye" className="h-4 w-4" />
                        </button>
                        <button className="p-2 rounded-xl text-muted hover:text-brand hover:bg-brand/10 transition" aria-label="Duyệt">
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
          <h2 id="deadlines-heading" className="font-bold text-navy">Mốc thời gian tới</h2>
          {[
            { label: "Hết hạn đăng ký", date: "2026-11-01T23:59:00+07:00", icon: "fileText", tone: "orange" },
            { label: "Vòng Sơ loại", date: "2026-11-22T08:00:00+07:00", icon: "messages", tone: "sky" },
            { label: "Vòng Bán kết", date: "2026-12-07T08:00:00+07:00", icon: "inbox", tone: "gold" },
            { label: "Vòng Chung kết", date: "2026-12-21T08:00:00+07:00", icon: "trophy", tone: "gold" },
          ].map((d, i) => (
            <article key={d.label} className="card p-4">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center bg-${d.tone}/10`}>
                  <Icon name={d.icon as any} className={`h-5 w-5 text-${d.tone}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-ink truncate">{d.label}</p>
                  <p className="text-sm text-muted">{new Date(d.date).toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                </div>
                <Countdown lang="vi" deadline={d.date} />
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
  if (ms <= 0) return <span className="text-sm font-semibold text-orange-ink">Đã hết hạn</span>;
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const parts = d > 0 ? `${d} ngày` : `${h}h ${m}m`;
  return <span className="text-sm font-mono font-semibold text-ink tabular-nums whitespace-nowrap">{parts}</span>;
}