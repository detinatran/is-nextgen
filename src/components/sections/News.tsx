import Link from "next/link";
import Eyebrow from "@/components/Eyebrow";
import Icon from "@/components/Icon";
import { getContent } from "@/content";
import type { Lang } from "@/lib/i18n";
import { localePath } from "@/lib/i18n";
import { asset } from "@/lib/paths";

const text = {
  vi: {
    eyebrow: "Tin tức",
    title: "Báo chí nói về NextGen Manager",
    lead: "Khám phá những góc nhìn từ báo chí về cuộc thi và hành trình phát triển năng lực quản trị của sinh viên.",
    readOn: "Bản gốc trên",
    readArticle: "Xem toàn văn bài viết",
    opensInNewTab: "mở trong tab mới",
    originalArticleVi: "Bài gốc tiếng Việt",
    authorLabel: "Tác giả",
  },
  en: {
    eyebrow: "News",
    title: "Press on NextGen Manager",
    lead: "Discover insights and perspectives from national press on the competition and students' leadership journey.",
    readOn: "Original on",
    readArticle: "Read full article",
    opensInNewTab: "opens in a new tab",
    originalArticleVi: "Original in Vietnamese",
    authorLabel: "Author",
  },
};

export default function News({ lang }: { lang: Lang }) {
  const { newsArticles } = getContent(lang);
  const t = text[lang];

  if (!newsArticles || newsArticles.length === 0) return null;

  return (
    <section
      id="tin-tuc"
      aria-label={t.title}
      className="relative scroll-mt-24 bg-linear-to-b from-white to-mist/60 py-16 lg:py-20"
    >
      <div className="container-x relative">
        <div className="text-center">
          <Eyebrow className="justify-center">
            {t.eyebrow}
            <span aria-hidden className="h-px w-8 shrink-0 bg-current" />
          </Eyebrow>
          <h2 className="h2-section mt-3">{t.title}</h2>
          <p className="lead mx-auto mt-3 max-w-2xl">{t.lead}</p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-8">
          {newsArticles.map((article) => {
            const detailHref = article.hasFullText
              ? localePath(lang, `/tin-tuc/${article.slug}/`)
              : null;

            return (
              <article
                key={article.id}
                className="group flex flex-col justify-between rounded-3xl bg-white p-5 shadow-card ring-1 ring-line transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:ring-brand/30 sm:p-6"
              >
                <div>
                  {/* Thumbnail container */}
                  <div className="relative aspect-16/10 w-full overflow-hidden rounded-2xl bg-mist">
                    {detailHref ? (
                      <Link href={detailHref} className="block h-full w-full">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={asset(article.thumbnail)}
                          alt={article.thumbnailAlt}
                          loading="lazy"
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-104"
                        />
                      </Link>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={asset(article.thumbnail)}
                        alt={article.thumbnailAlt}
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-104"
                      />
                    )}
                  </div>

                  {/* Metadata: Source badge & Published date */}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-brand/10 px-3 py-1 font-semibold text-brand">
                        {article.source}
                      </span>
                      {article.sourceRole && (
                        <span className="rounded-full bg-orange/10 px-2.5 py-0.5 font-medium text-orange-ink">
                          {article.sourceRole}
                        </span>
                      )}
                      {lang === "en" && (
                        <span className="rounded-full bg-mist px-2.5 py-0.5 font-medium text-muted ring-1 ring-line">
                          {t.originalArticleVi}
                        </span>
                      )}
                    </div>
                    <time
                      dateTime={article.publishedAt}
                      className="text-muted/80"
                    >
                      {article.publishedDateLabel}
                    </time>
                  </div>

                  {/* Title */}
                  <h3 className="mt-3 text-lg font-bold leading-snug text-navy transition-colors group-hover:text-brand sm:text-xl">
                    {detailHref ? (
                      <Link href={detailHref} className="hover:underline">
                        {article.title}
                      </Link>
                    ) : (
                      <a
                        href={article.originalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {article.title}
                      </a>
                    )}
                  </h3>

                  {lang === "en" && article.title !== article.originalTitle && (
                    <p className="mt-1.5 text-xs italic text-muted/85">
                      {article.originalTitle}
                    </p>
                  )}

                  {/* Summary */}
                  <p className="mt-3 text-[15px] leading-relaxed text-muted">
                    {article.summary}
                  </p>
                </div>

                {/* Card Action Buttons */}
                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line/70 pt-4">
                  <div className="flex flex-wrap items-center gap-2.5">
                    {detailHref && (
                      <Link
                        href={detailHref}
                        className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                      >
                        <span>{t.readArticle}</span>
                        <Icon name="arrowRight" className="h-3.5 w-3.5" />
                      </Link>
                    )}
                    <a
                      href={article.originalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-line bg-mist/40 px-3.5 py-2 text-xs font-semibold text-navy transition hover:border-navy/30 hover:bg-mist hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                    >
                      <span>{t.readOn}</span>
                      <Icon name="externalLink" className="h-3.5 w-3.5" />
                      <span className="sr-only">({t.opensInNewTab})</span>
                    </a>
                  </div>

                  {article.author && (
                    <span className="text-xs font-medium text-muted">
                      {t.authorLabel}: <strong className="text-navy">{article.author}</strong>
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
