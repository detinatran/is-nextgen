import type { Metadata } from "next";
import Link from "next/link";
import Eyebrow from "@/components/Eyebrow";
import Icon from "@/components/Icon";
import PageHero from "@/components/PageHero";
import SiteShell from "@/components/SiteShell";
import {
  competencies,
  eligibility,
  eligibilityNote,
  judgingRules,
  moreFaqs,
  roundIcons,
  rounds,
  sideEvents,
  timeline,
  votingRules,
} from "@/content/site";

export const metadata: Metadata = { title: "Thể lệ | IS-NextGen Manager Challenge 2026" };

function Block({ id, eyebrow, title, children }: { id?: string; eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="reveal scroll-mt-28">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="h2-section mt-4">{title}</h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

export default function RulesPage() {
  return (
    <SiteShell>
      <PageHero
        eyebrow="Thể lệ cuộc thi"
        title="Thể lệ"
        lead="Bốn vòng thi, một khung sáu năng lực. Mọi vòng đều có tiêu chí và thang điểm công bố trước."
      />
      <div className="container-x space-y-20 py-16 lg:py-20">
        <Block eyebrow="Đối tượng" title="Ai được tham gia?">
          <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
            <ul className="card space-y-3 p-6">
              {eligibility.map((e) => (
                <li key={e} className="flex gap-3 text-[15px] text-ink">
                  <Icon name="check" className="mt-0.5 h-5 w-5 shrink-0 text-orange" strokeWidth={2.2} />
                  {e}
                </li>
              ))}
            </ul>
            <p className="rounded-2xl border border-orange/15 bg-cream p-6 text-base leading-relaxed text-muted">{eligibilityNote}</p>
          </div>
        </Block>

        <Block eyebrow="Thể thức" title="Bốn vòng thi">
          <div className="space-y-4">
            {rounds.map((r, i) => (
              <article id={`vong-${i + 1}`} key={r.no} className="card scroll-mt-28 overflow-hidden md:flex">
                <div className={`flex items-center gap-4 bg-linear-to-br ${r.gradient} p-6 text-white md:w-64 md:flex-col md:items-start md:justify-center`}>
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-white/60 bg-white/10">
                    <Icon name={roundIcons[i]} className="h-6 w-6" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold tracking-wider text-white/90 uppercase">{r.step}</p>
                    <h3 className="text-lg leading-snug font-bold">{r.name}</h3>
                  </div>
                </div>
                <div className="flex-1 p-6">
                  <div className="flex flex-wrap gap-2 text-sm font-medium">
                    <span className="rounded-full bg-mist px-3 py-1 text-navy">{r.format}</span>
                    <span className="rounded-full bg-mist px-3 py-1 text-navy">{r.duration}</span>
                    <span className="rounded-full bg-cream px-3 py-1 text-orange-ink">{r.funnel}</span>
                  </div>
                  <p className="mt-4 leading-relaxed text-muted">{r.body}</p>
                </div>
              </article>
            ))}
          </div>
        </Block>

        <Block eyebrow="Khung năng lực" title="Sáu nhóm năng lực được chấm">
          <p className="-mt-2 mb-6 max-w-3xl text-muted">
            Mỗi nhóm được mô tả bằng 05 mức hành vi quan sát được. Giám khảo ghi nhận hành vi cụ thể, sau đó quy đổi ra điểm theo
            bảng quy đổi thống nhất.
          </p>
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {competencies.map((c, i) => (
              <li key={c.name} className="card p-5">
                <span className="text-2xl font-extrabold text-orange">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-2 font-bold text-navy">{c.name}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-muted">{c.body}</p>
              </li>
            ))}
          </ol>
        </Block>

        <div className="grid gap-6 lg:grid-cols-2">
          <aside className="reveal relative overflow-hidden rounded-2xl bg-linear-to-br from-navy to-navy-soft p-7 text-white sm:p-9">
            <Eyebrow light>Vòng Bán kết và Chung kết</Eyebrow>
            <h2 className="mt-3 text-2xl font-bold">Được dùng AI, nhưng phải giải trình</h2>
            <p className="mt-4 text-base leading-relaxed text-white/90">
              Khai báo bạn đã dùng công cụ như thế nào, phần nào là kết quả của công cụ, phần nào là phán đoán của bạn, và vì sao
              giữ hay bác bỏ từng gợi ý. Điểm số tập trung vào phần giải trình.
            </p>
            <Icon name="sparkles" className="absolute -right-4 -bottom-4 h-36 w-36 text-white/5" />
          </aside>
          <aside className="card reveal p-7 sm:p-9">
            <Eyebrow>Nguyên tắc chấm thi</Eyebrow>
            <ul className="mt-4 space-y-3">
              {judgingRules.map((rule) => (
                <li key={rule} className="flex gap-3 text-[15px] leading-relaxed text-ink">
                  <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-orange" strokeWidth={2.2} />
                  {rule}
                </li>
              ))}
            </ul>
          </aside>
        </div>

        <Block eyebrow="Hoạt động bên lề" title="Gặp doanh nghiệp trước khi bước vào nghề">
          <div className="grid gap-5 lg:grid-cols-2">
            {sideEvents.map((e) => (
              <article key={e.tag} className="card p-6 sm:p-7">
                <p className="text-sm font-bold tracking-wider text-orange-ink uppercase">{e.tag}</p>
                <h3 className="mt-2 text-xl font-bold text-navy">{e.title}</h3>
                <dl className="mt-4 space-y-1 text-[15px]">
                  <div className="flex gap-2">
                    <dt className="shrink-0 font-semibold text-navy">Thời gian:</dt>
                    <dd className="text-muted">{e.when}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="shrink-0 font-semibold text-navy">Thành phần:</dt>
                    <dd className="text-muted">{e.who}</dd>
                  </div>
                </dl>
                <p className="mt-4 text-[15px] leading-relaxed text-muted">{e.body}</p>
              </article>
            ))}
          </div>
        </Block>

        <Block id="lo-trinh" eyebrow="Lộ trình" title="Lịch đầy đủ mùa I">
          <ol className="relative space-y-5 border-l-2 border-orange/25 pl-6">
            {timeline.map((t) => (
              <li key={t.title} className="relative">
                <span className="absolute top-1.5 -left-[31px] h-3.5 w-3.5 rounded-full border-2 border-white bg-orange shadow" />
                <p className="text-[15px] font-bold text-orange-ink">{t.date}</p>
                <p className="font-semibold text-navy">{t.title}</p>
                <p className="text-[15px] text-muted">{t.body}</p>
              </li>
            ))}
          </ol>
        </Block>

        <Block eyebrow="Giải phụ" title="Thể lệ bình chọn Đội thi được yêu thích nhất">
          <ul className="card space-y-3 p-6">
            {votingRules.map((v) => (
              <li key={v} className="flex gap-3 text-[15px] leading-relaxed text-ink">
                <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-orange" strokeWidth={2.2} />
                {v}
              </li>
            ))}
          </ul>
        </Block>

        <Block eyebrow="Hỏi đáp" title="Câu hỏi khác">
          <div className="space-y-3">
            {moreFaqs.map((f) => (
              <details key={f.q} className="card group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 font-medium text-navy [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <Icon name="plus" className="h-4 w-4 shrink-0 transition group-open:rotate-45 group-open:text-orange" strokeWidth={2} />
                </summary>
                <p className="px-5 pb-4 text-[15px] leading-relaxed text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </Block>

        <div className="reveal text-center">
          <Link href="/dang-ky/" className="btn-primary px-8 py-3.5 text-base">
            Đăng ký dự thi <Icon name="arrowRight" className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </SiteShell>
  );
}
