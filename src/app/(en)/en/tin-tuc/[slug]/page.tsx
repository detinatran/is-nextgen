import type { Metadata } from "next";
import { newsArticlesEn } from "@/content/news";
import { pageMetadata } from "@/lib/meta";
import NewsDetailPage from "@/views/NewsDetailPage";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return newsArticlesEn
    .filter((a) => a.hasFullText)
    .map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = newsArticlesEn.find((a) => a.slug === slug);
  if (!article) return pageMetadata("en", "/tin-tuc/", "News");
  return pageMetadata("en", `/tin-tuc/${slug}/`, article.originalTitle);
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  return <NewsDetailPage slug={slug} lang="en" />;
}
