import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { newsArticlesVi, newsArticlesEn } from "../src/content/news.ts";

test("news articles: both Vi and En have matching counts and IDs", () => {
  assert.equal(newsArticlesVi.length, newsArticlesEn.length);
  assert.ok(newsArticlesVi.length >= 8, `Expected at least 8 articles, got ${newsArticlesVi.length}`);

  for (let i = 0; i < newsArticlesVi.length; i++) {
    assert.equal(newsArticlesVi[i].id, newsArticlesEn[i].id, `Article ID mismatch at index ${i}`);
    assert.equal(newsArticlesVi[i].slug, newsArticlesEn[i].slug, `Slug mismatch at index ${i}`);
    assert.equal(newsArticlesVi[i].hasFullText, newsArticlesEn[i].hasFullText, `hasFullText mismatch at index ${i}`);
    assert.equal(newsArticlesVi[i].originalUrl, newsArticlesEn[i].originalUrl, `originalUrl mismatch at index ${i}`);
    assert.equal(newsArticlesVi[i].publishedAt, newsArticlesEn[i].publishedAt, `publishedAt mismatch at index ${i}`);
  }
});

test("news articles: all slugs and IDs are globally unique", () => {
  const ids = new Set<string>();
  const slugs = new Set<string>();

  for (const a of newsArticlesVi) {
    assert.ok(!ids.has(a.id), `Duplicate article id: ${a.id}`);
    assert.ok(!slugs.has(a.slug), `Duplicate article slug: ${a.slug}`);
    ids.add(a.id);
    slugs.add(a.slug);
  }
});

test("news articles: includes requested articles with full text", () => {
  const requestedIds = ["phunuvn", "tcdn", "gtvh-kt", "gtvh-cst"];
  for (const id of requestedIds) {
    const vi = newsArticlesVi.find((a) => a.id === id);
    const en = newsArticlesEn.find((a) => a.id === id);
    assert.ok(vi, `Missing VI article for ${id}`);
    assert.ok(en, `Missing EN article for ${id}`);
    assert.equal(vi.hasFullText, true, `VI article ${id} must have full text`);
    assert.equal(en.hasFullText, true, `EN article ${id} must have full text`);
    assert.ok(vi.sections.length > 0, `VI article ${id} must have sections`);
    assert.ok(en.sections.length > 0, `EN article ${id} must have sections`);
    assert.ok(vi.sapo.length > 20, `VI article ${id} must have sapo`);
    assert.ok(en.sapo.length > 20, `EN article ${id} must have sapo`);
  }
});

test("news articles: all thumbnail and section images exist in public/", () => {
  const publicDir = path.resolve("public");

  const checkImage = (src: string, context: string) => {
    if (src.startsWith("/")) {
      const filePath = path.join(publicDir, src);
      assert.ok(fs.existsSync(filePath), `Image not found on disk: ${src} in ${context}`);
      const stat = fs.statSync(filePath);
      assert.ok(stat.size > 500, `Image file too small or empty (${stat.size} bytes): ${src} in ${context}`);
    } else {
      assert.ok(src.startsWith("http"), `Invalid image src: ${src} in ${context}`);
    }
  };

  for (const a of [...newsArticlesVi, ...newsArticlesEn]) {
    checkImage(a.thumbnail, `Article ${a.id} thumbnail`);
    for (let i = 0; i < a.sections.length; i++) {
      const s = a.sections[i];
      if (s.type === "image" && s.src) {
        checkImage(s.src, `Article ${a.id} section ${i}`);
      }
    }
  }
});

test("news articles: dates and original URLs are well-formed", () => {
  for (const a of newsArticlesVi) {
    const time = new Date(a.publishedAt).getTime();
    assert.ok(!Number.isNaN(time), `Invalid publishedAt date: ${a.publishedAt} in ${a.id}`);
    assert.ok(a.originalUrl.startsWith("https://"), `originalUrl must be https in ${a.id}: ${a.originalUrl}`);
    assert.ok(a.title.trim().length > 10, `Title too short in ${a.id}`);
    assert.ok(a.summary.trim().length > 20, `Summary too short in ${a.id}`);
  }
});
