import Countdown from "@/components/Countdown";
import Icon from "@/components/Icon";
import PageHero from "@/components/PageHero";
import RegisterForm from "@/components/RegisterForm";
import DeadlineLabel from "@/components/DeadlineLabel";
import SiteShell from "@/components/SiteShell";
import { getContent } from "@/content";
import type { Lang } from "@/lib/i18n";

export const registerText = {
  vi: {
    eyebrow: "Mùa I · 2026",
    title: "Đăng ký dự thi",
    lead: "Đăng ký cá nhân, không thu lệ phí. Ban Tổ chức gửi email xác nhận kèm tài khoản thí sinh ngay sau khi bạn đăng ký.",
    deadline: "Thời hạn đăng ký",
    prepare: "Bạn cần chuẩn bị",
    checklist: [
      "Thông tin cá nhân và mã số sinh viên",
      "01 video cá nhân tối đa 02 phút, chủ đề tự chọn (MP4 dưới 300 MB). Chưa có video vẫn đăng ký được: nộp bổ sung trong tài khoản thí sinh trước 23h59 ngày 06/11",
      "01 ảnh cá nhân rõ mặt (JPG, PNG) dưới 10 MB để Ban Tổ chức làm truyền thông",
      "Thẻ sinh viên hoặc giấy xác nhận để xuất trình ở các vòng thi trực tiếp",
    ],
  },
  en: {
    eyebrow: "Season I · 2026",
    title: "Register",
    lead: "Individual entry, free of charge. The Organizing Committee emails you a confirmation with your candidate account right after you register.",
    deadline: "Registration deadline",
    prepare: "What you need",
    checklist: [
      "Your personal details and student ID",
      "01 personal video of up to 02 minutes on a topic of your choice (MP4 under 300 MB). No video yet? You can still register and upload it from your candidate account by 23:59 on Nov 6",
      "01 clear personal photo (JPG, PNG) under 10 MB for the competition's communications",
      "Your student card or enrolment letter to show at in-person rounds",
    ],
  },
};

export default function RegisterPage({ lang }: { lang: Lang }) {
  const { site } = getContent(lang);
  const t = registerText[lang];
  return (
    <SiteShell lang={lang} cta={false}>
      <PageHero lang={lang} eyebrow={t.eyebrow} title={t.title} lead={t.lead} />
      <div className="container-x grid gap-8 py-16 lg:grid-cols-[1fr_1.4fr] lg:py-20">
        <div className="space-y-6">
          <div className="rounded-2xl bg-linear-to-br from-navy to-navy-soft p-6 text-white shadow-card">
            <p className="text-center text-[13px] font-semibold tracking-[0.15em] text-white uppercase">{t.deadline}</p>
            <div className="mt-4">
              <Countdown lang={lang} deadline={site.registrationDeadline} />
            </div>
            <p className="mt-3 text-center text-[13px] text-white/75"><DeadlineLabel lang={lang} fallback={site.registrationDeadlineLabel} /></p>
          </div>
          <div className="card p-6">
            <h2 className="font-bold text-navy">{t.prepare}</h2>
            <ul className="mt-4 space-y-3">
              {t.checklist.map((c) => (
                <li key={c} className="flex gap-3 text-[15px] leading-relaxed text-ink">
                  <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-orange" strokeWidth={2.2} />
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <RegisterForm lang={lang} deadline={site.registrationDeadline} />
      </div>
    </SiteShell>
  );
}
