import type { Metadata } from "next";
import { newsArticlesVi } from "@/content/news";
import { pageMetadata } from "@/lib/meta";
import NewsDetailPage from "@/views/NewsDetailPage";

export const dynamicParams = false;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return newsArticlesVi
    .filter((a) => a.hasFullText)
    .map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = newsArticlesVi.find((a) => a.slug === slug);
  if (!article) return pageMetadata("vi", "/tin-tuc/", "Tin tức");
  return pageMetadata("vi", `/tin-tuc/${slug}/`, article.title);
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  return <NewsDetailPage slug={slug} lang="vi" />;
}
