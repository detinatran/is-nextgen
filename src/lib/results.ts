import { asset } from "./paths";

export type ResultStatus = "upcoming" | "soon" | "published";

export type ResultItem = {
  round: string;
  title: string;
  status: ResultStatus;
  date: string;
  link: string;
  /** Bản tiếng Anh (cột round_en, title_en, date_en trong Google Sheet); trống thì dùng bản tiếng Việt */
  roundEn: string;
  titleEn: string;
  dateEn: string;
};

type RawResult = Partial<Record<"round" | "title" | "status" | "date" | "link" | "roundEn" | "titleEn" | "dateEn" | "round_en" | "title_en" | "date_en", string>>;

const STATUSES: ResultStatus[] = ["upcoming", "soon", "published"];

function normalize(raw: RawResult): ResultItem {
  const status = (raw.status || "").trim().toLowerCase() as ResultStatus;
  return {
    round: (raw.round || "").trim(),
    title: (raw.title || "").trim(),
    status: STATUSES.includes(status) ? status : "upcoming",
    date: (raw.date || "").trim(),
    link: (raw.link || "").trim(),
    roundEn: (raw.roundEn || raw.round_en || "").trim(),
    titleEn: (raw.titleEn || raw.title_en || "").trim(),
    dateEn: (raw.dateEn || raw.date_en || "").trim(),
  };
}

// CSV đơn giản do Google Sheets xuất: hỗ trợ ô có dấu phẩy nằm trong ngoặc kép.
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += ch;
    }
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim()));
}

export async function loadResults(): Promise<ResultItem[]> {
  const csvUrl = process.env.NEXT_PUBLIC_RESULTS_CSV_URL;
  if (csvUrl) {
    const res = await fetch(csvUrl, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const [header, ...rows] = parseCsv(await res.text());
    const keys = header.map((h) => h.trim().toLowerCase());
    return rows.map((r) => normalize(Object.fromEntries(keys.map((k, i) => [k, r[i]]))));
  }
  const res = await fetch(asset("/data/results.json"), { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as { items: RawResult[] };
  return data.items.map(normalize);
}
