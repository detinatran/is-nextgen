import Link from "next/link";
import { notFound } from "next/navigation";
import Icon from "@/components/Icon";
import SiteShell from "@/components/SiteShell";
import { getContent } from "@/content";
import type { Lang } from "@/lib/i18n";
import { localePath } from "@/lib/i18n";
import { asset } from "@/lib/paths";

interface Props {
  slug: string;
  lang: Lang;
}

const text = {
  vi: {
    backToNews: "Quay lại mục Tin tức",
    home: "Trang chủ",
    news: "Tin tức",
    reprintedFrom: "Đăng lại từ",
    originalArticle: "Đọc bản gốc trên",
    author: "Tác giả",
    publishedAt: "Thời gian đăng",
    note: "Bài viết được đăng lại nguyên văn từ đơn vị bảo trợ truyền thông chính thức của cuộc thi NextGen Manager 2026.",
  },
  en: {
    backToNews: "Back to News",
    home: "Home",
    news: "News",
    reprintedFrom: "Reprinted from",
    originalArticle: "Read original article on",
    author: "Author",
    publishedAt: "Published",
    note: "This article is reprinted verbatim from the official media partner of NextGen Manager 2026.",
  },
};

export default function NewsDetailPage({ slug, lang }: Props) {
  const { newsArticles } = getContent(lang);
  const article = newsArticles.find((a) => a.slug === slug);
  const t = text[lang];

  if (!article || !article.hasFullText) {
    notFound();
  }

  return (
    <SiteShell lang={lang}>
      <article className="min-h-screen bg-linear-to-b from-mist/50 via-white to-mist/30 pt-28 pb-20 lg:pt-32">
        <div className="container-x">
          <div className="mx-auto max-w-4xl">
            {/* Breadcrumb navigation */}
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-2 text-xs font-medium text-muted sm:text-sm"
            >
              <Link
                href={localePath(lang, "/")}
                className="transition hover:text-navy"
              >
                {t.home}
              </Link>
              <span aria-hidden="true" className="text-muted/50">
                /
              </span>
              <Link
                href={localePath(lang, "/#tin-tuc")}
                className="transition hover:text-navy"
              >
                {t.news}
              </Link>
              <span aria-hidden="true" className="text-muted/50">
                /
              </span>
              <span className="truncate text-navy font-semibold">
                {article.source}
              </span>
            </nav>

            {/* Back link */}
            <div className="mt-4">
              <Link
                href={localePath(lang, "/#tin-tuc")}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand transition hover:gap-2"
              >
                <Icon name="chevronLeft" className="h-4 w-4" />
                <span>{t.backToNews}</span>
              </Link>
            </div>

            {/* Article Header Box */}
            <header className="mt-6 rounded-3xl bg-white p-6 shadow-card ring-1 ring-line sm:p-10">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="rounded-full bg-brand/10 px-3.5 py-1 text-xs font-semibold text-brand">
                  {article.source}
                </span>
                {article.sourceRole && (
                  <span className="rounded-full bg-orange/10 px-3 py-1 text-xs font-semibold text-orange-ink">
                    {article.sourceRole}
                  </span>
                )}
              </div>

              <h1 className="mt-4 text-2xl font-bold leading-tight text-navy sm:text-3xl lg:text-4xl">
                {article.originalTitle}
              </h1>

              {/* Attribution Meta Bar */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-y border-line/80 py-4 text-xs text-muted sm:text-sm">
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                  {article.author && (
                    <span>
                      <strong className="text-navy">{t.author}:</strong>{" "}
                      {article.author}
                    </span>
                  )}
                  <span>
                    <strong className="text-navy">{t.publishedAt}:</strong>{" "}
                    {article.publishedDateLabel}
                  </span>
                </div>
                <div>
                  <a
                    href={article.originalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-orange-ink transition hover:text-orange"
                  >
                    <span>
                      {t.originalArticle} {article.source}
                    </span>
                    <Icon name="externalLink" className="h-4 w-4" />
                  </a>
                </div>
              </div>

              {/* Sapo */}
              {article.sapo && (
                <div className="mt-6 border-l-4 border-orange bg-mist/35 p-4.5 rounded-r-2xl sm:p-5">
                  <p className="text-base font-medium leading-relaxed text-navy sm:text-[17px]">
                    {article.sapo}
                  </p>
                </div>
              )}
            </header>

            {/* Verbatim Article Content */}
            <div className="mt-8 rounded-3xl bg-white p-6 shadow-card ring-1 ring-line sm:p-10">
              <div className="space-y-6 text-[16px] leading-relaxed text-ink/90 sm:text-[17px]">
                {article.sections?.map((sec, idx) => {
                  if (sec.type === "heading") {
                    return (
                      <h2
                        key={idx}
                        className="pt-4 text-xl font-bold text-navy sm:text-2xl"
                      >
                        {sec.content}
                      </h2>
                    );
                  }
                  if (sec.type === "quote") {
                    return (
                      <blockquote
                        key={idx}
                        className="my-4 border-l-4 border-brand bg-brand/5 px-5 py-4 italic text-navy rounded-r-xl"
                      >
                        {sec.content}
                      </blockquote>
                    );
                  }
                  if (sec.type === "image" && sec.src) {
                    return (
                      <figure key={idx} className="my-6">
                        <div className="overflow-hidden rounded-2xl bg-mist ring-1 ring-line">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={asset(sec.src)}
                            alt={sec.caption || article.originalTitle}
                            className="w-full object-cover"
                          />
                        </div>
                        {sec.caption && (
                          <figcaption className="mt-2 text-center text-xs text-muted sm:text-sm">
                            {sec.caption}
                          </figcaption>
                        )}
                      </figure>
                    );
                  }
                  return (
                    <p key={idx} className="text-justify leading-relaxed">
                      {sec.content}
                    </p>
                  );
                })}
              </div>

              {/* End of article notice & attribution */}
              <div className="mt-10 border-t border-line pt-6">
                <div className="rounded-2xl bg-mist/50 p-4 text-xs text-muted sm:text-sm">
                  <p className="font-medium text-navy">
                    {t.reprintedFrom} {article.source}
                  </p>
                  <p className="mt-1">{t.note}</p>
                  <p className="mt-2 truncate">
                    <span className="font-semibold text-navy">URL:</span>{" "}
                    <a
                      href={article.originalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand hover:underline"
                    >
                      {article.originalUrl}
                    </a>
                  </p>
                </div>

                <div className="mt-6 flex justify-between items-center">
                  <Link
                    href={localePath(lang, "/#tin-tuc")}
                    className="inline-flex items-center gap-2 rounded-full border border-navy/20 bg-white px-5 py-2.5 text-sm font-semibold text-navy transition hover:bg-mist"
                  >
                    <Icon name="chevronLeft" className="h-4 w-4" />
                    <span>{t.backToNews}</span>
                  </Link>

                  <a
                    href={article.originalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary px-5 py-2.5 text-sm"
                  >
                    <span>{t.originalArticle} {article.source}</span>
                    <Icon name="externalLink" className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </article>
    </SiteShell>
  );
}
