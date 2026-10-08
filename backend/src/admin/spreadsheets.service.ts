import { Injectable } from "@nestjs/common";
import ExcelJS from "exceljs";
import AdmZip from "adm-zip";
import { XMLParser } from "fast-xml-parser";
import { AppException } from "../common/errors/app-error";
import { QuestionInput, safeCell, ScoreRow, validateQuestion } from "./domain";

export const QUESTION_HEADERS = [
  "prompt",
  "A",
  "B",
  "C",
  "D",
  "answer",
  "difficulty",
  "pool",
];
export const SCORE_HEADERS = [
  "subjectType",
  "code",
  "judge",
  "criterion",
  "score",
];
export type ImportIssue = { row: number; message: string };

@Injectable()
export class SpreadsheetsService {
  docxTemplate(): Buffer {
    const zip = new AdmZip();
    zip.addFile(
      "[Content_Types].xml",
      Buffer.from(
        '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
      ),
    );
    zip.addFile(
      "_rels/.rels",
      Buffer.from(
        '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
      ),
    );
    const rows = [
      QUESTION_HEADERS,
      ["1 + 1 = ?", "1", "2", "3", "4", "B", "EASY", "General"],
    ];
    const table = rows
      .map(
        (row) =>
          "<w:tr>" +
          row
            .map(
              (cell) => `<w:tc><w:p><w:r><w:t>${cell}</w:t></w:r></w:p></w:tc>`,
            )
            .join("") +
          "</w:tr>",
      )
      .join("");
    zip.addFile(
      "word/document.xml",
      Buffer.from(
        `<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:tbl><w:tblPr><w:tblBorders><w:top w:val="single" w:sz="4"/><w:left w:val="single" w:sz="4"/><w:bottom w:val="single" w:sz="4"/><w:right w:val="single" w:sz="4"/><w:insideH w:val="single" w:sz="4"/><w:insideV w:val="single" w:sz="4"/></w:tblBorders></w:tblPr>${table}</w:tbl><w:sectPr/></w:body></w:document>`,
      ),
    );
    return zip.toBuffer();
  }
  async export(
    headers: string[],
    rows: unknown[][],
    format: string,
  ): Promise<Buffer> {
    if (format === "csv") {
      const escape = (v: unknown) =>
        `"${String(safeCell(v)).replace(/"/g, '""')}"`;
      return Buffer.from(
        "\uFEFF" +
          [headers, ...rows].map((r) => r.map(escape).join(",")).join("\r\n"),
        "utf8",
      );
    }
    if (format !== "xlsx")
      throw AppException.validation("Định dạng phải là csv hoặc xlsx");
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Data");
    sheet.addRow(headers);
    rows.forEach((row) => sheet.addRow(row.map(safeCell)));
    sheet.getRow(1).font = { bold: true };
    sheet.views = [{ state: "frozen", ySplit: 1 }];
    sheet.columns.forEach((column) => {
      column.width = 24;
    });
    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  async read(
    file: Express.Multer.File,
    headers: string[],
    allowDocx = false,
  ): Promise<string[][]> {
    if (!file?.buffer?.length) throw AppException.validation("Chưa chọn tệp");
    let rows: string[][];
    try {
      if (/\.xlsx$/i.test(file.originalname)) {
        const zip = new AdmZip(file.buffer);
        if (
          zip.getEntries().reduce((s, e) => s + e.header.size, 0) > 30_000_000
        )
          throw new Error("size");
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(file.buffer as never);
        const sheet = workbook.worksheets[0];
        if (sheet && sheet.getRow(1).cellCount !== headers.length)
          throw AppException.validation("Số cột không khớp với mẫu");
        if (!sheet || sheet.rowCount > 5001 || sheet.columnCount > 50)
          throw new Error("size");
        rows = [];
        sheet.eachRow({ includeEmpty: true }, (row) => {
          const cells: string[] = [];
          for (let i = 1; i <= headers.length; i++) {
            const value = row.getCell(i).value;
            if (
              typeof value === "object" &&
              value !== null &&
              ("formula" in value || "sharedFormula" in value)
            )
              throw new Error("formula");
            cells.push(row.getCell(i).text.trim());
          }
          rows.push(cells);
        });
      } else if (allowDocx && /\.docx$/i.test(file.originalname)) {
        const zip = new AdmZip(file.buffer);
        const entry = zip.getEntry("word/document.xml");
        if (
          !entry ||
          entry.header.size > 10_000_000 ||
          zip.getEntries().reduce((s, e) => s + e.header.size, 0) > 30_000_000
        )
          throw new Error("size");
        const xml = entry.getData().toString("utf8");
        if (/<!DOCTYPE|<!ENTITY/i.test(xml)) throw new Error("xml");
        const doc = new XMLParser({
          removeNSPrefix: true,
          ignoreAttributes: true,
        }).parse(xml) as { document?: { body?: { tbl?: unknown } } };
        const tables = this.array(doc.document?.body?.tbl);
        if (tables.length !== 1) throw new Error("table");
        rows = this.array(this.record(tables[0]).tr).map((row) =>
          this.array(this.record(row).tc).map((cell) =>
            this.docText(cell).trim(),
          ),
        );
        if (rows.length > 5001) throw new Error("size");
      } else
        throw AppException.validation(
          "Chỉ chấp nhận xlsx" + (allowDocx ? " hoặc docx theo bảng mẫu" : ""),
        );
    } catch (e) {
      if (e instanceof AppException) throw e;
      throw AppException.validation(
        "Tệp không hợp lệ. Dùng mẫu, tối đa 5.000 dòng; không dùng công thức Excel",
      );
    }
    if (
      !rows.length ||
      rows[0].length !== headers.length ||
      headers.some((h, i) => rows[0][i]?.toLowerCase() !== h.toLowerCase())
    )
      throw AppException.validation(
        `Sai cấu trúc. Các cột cần có: ${headers.join(", ")}`,
      );
    return rows.slice(1);
  }

  async questions(
    file: Express.Multer.File,
  ): Promise<{ rows: QuestionInput[]; errors: ImportIssue[] }> {
    const raw = await this.read(file, QUESTION_HEADERS, true);
    const rows: QuestionInput[] = [],
      errors: ImportIssue[] = [];
    raw.forEach((cells, index) => {
      if (cells.every((c) => !c)) return;
      const [prompt, a, b, c, d, answer, difficulty, pool] = cells;
      const options = [a, b, c, d];
      while (options.length && !options[options.length - 1]) options.pop();
      const q = {
        prompt,
        options,
        answer: ["A", "B", "C", "D"].indexOf(answer.toUpperCase()),
        difficulty: difficulty.toUpperCase(),
        pool,
      };
      validateQuestion(q).forEach((message) =>
        errors.push({ row: index + 2, message }),
      );
      rows.push(q);
    });
    if (!rows.length) errors.push({ row: 2, message: "Tệp không có câu hỏi" });
    return { rows, errors };
  }

  async scores(
    file: Express.Multer.File,
  ): Promise<{ rows: ScoreRow[]; errors: ImportIssue[] }> {
    const raw = await this.read(file, SCORE_HEADERS);
    const rows: ScoreRow[] = [],
      errors: ImportIssue[] = [];
    raw.forEach((cells, index) => {
      if (cells.every((c) => !c)) return;
      const [subjectType, code, judge, criterion, value] = cells;
      const score = Number(value);
      if (
        Number.isFinite(score) &&
        Math.abs(score * 10000 - Math.round(score * 10000)) > 0.00001
      )
        errors.push({
          row: index + 2,
          message: "Điểm chỉ được có tối đa 4 chữ số thập phân",
        });
      if (
        !["CANDIDATE", "TEAM"].includes(subjectType) ||
        !code ||
        !judge ||
        judge.length > 120 ||
        !criterion ||
        !value ||
        !Number.isFinite(score) ||
        score < 0
      )
        errors.push({
          row: index + 2,
          message: "Sai loại đối tượng, mã, giám khảo, tiêu chí hoặc điểm",
        });
      rows.push({
        sourceRow: index + 2,
        subjectType: subjectType as ScoreRow["subjectType"],
        code,
        judge,
        criterion,
        score,
      });
    });
    if (!rows.length) errors.push({ row: 2, message: "Tệp không có điểm" });
    return { rows, errors };
  }

  private array(value: unknown): unknown[] {
    return value === undefined || value === null
      ? []
      : Array.isArray(value)
        ? value
        : [value];
  }
  private record(value: unknown): Record<string, unknown> {
    return value !== null && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};
  }
  private docText(value: unknown): string {
    if (value === null || value === undefined || typeof value !== "object")
      return "";
    return Object.entries(this.record(value))
      .map(([key, v]) =>
        key === "t"
          ? String(v)
          : key === "p"
            ? this.array(v)
                .map((p) => this.docText(p))
                .join(" ")
            : this.array(v)
                .map((x) => this.docText(x))
                .join(""),
      )
      .join("");
  }
}
