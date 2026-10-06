export interface ManualScoringItem {
  caseId: string;
  candidateCode: string;
  fullName: string;
  roundName: "Vòng 2 (Video & Tự luận)" | "Vòng Chung kết (Thuyết trình)";
  reviewerA: { name: string; score: number | null };
  reviewerB: { name: string; score: number | null };
  reviewerC: { name: string; score: number | null };
  scoreDiff: number | null; // % discrepancy
  finalScore: number | null;
  state: "AWAITING_REVIEWERS" | "SCORING" | "NEEDS_THIRD" | "COMPLETED";
}

export const mockScoringCases: ManualScoringItem[] = [
  {
    caseId: "case-001",
    candidateCode: "CAND-00101",
    fullName: "Nguyễn Hoàng Nam",
    roundName: "Vòng 2 (Video & Tự luận)",
    reviewerA: { name: "GK. TS. Trần Hải Yến", score: 8.5 },
    reviewerB: { name: "GK. ThS. Lê Đình Phong", score: 8.2 },
    reviewerC: { name: "Chưa gán", score: null },
    scoreDiff: 3.6,
    finalScore: 8.35,
    state: "COMPLETED",
  },
  {
    caseId: "case-002",
    candidateCode: "CAND-00102",
    fullName: "Trần Thị Mai Anh",
    roundName: "Vòng 2 (Video & Tự luận)",
    reviewerA: { name: "GK. TS. Trần Hải Yến", score: 9.0 },
    reviewerB: { name: "GK. ThS. Lê Đình Phong", score: 6.8 },
    reviewerC: { name: "GK. PGS. Nguyễn Văn An", score: 8.0 },
    scoreDiff: 24.4, // > 20% -> NEEDS_THIRD triggered
    finalScore: 8.0,
    state: "NEEDS_THIRD",
  },
  {
    caseId: "case-003",
    candidateCode: "CAND-00103",
    fullName: "Lê Minh Tuấn",
    roundName: "Vòng 2 (Video & Tự luận)",
    reviewerA: { name: "GK. TS. Trần Hải Yến", score: 7.8 },
    reviewerB: { name: "GK. ThS. Lê Đình Phong", score: null },
    reviewerC: { name: "Chưa gán", score: null },
    scoreDiff: null,
    finalScore: null,
    state: "SCORING",
  },
  {
    caseId: "case-004",
    candidateCode: "CAND-00104",
    fullName: "Phạm Hải Đăng",
    roundName: "Vòng Chung kết (Thuyết trình)",
    reviewerA: { name: "Chưa chấm", score: null },
    reviewerB: { name: "Chưa chấm", score: null },
    reviewerC: { name: "Chưa gán", score: null },
    scoreDiff: null,
    finalScore: null,
    state: "AWAITING_REVIEWERS",
  },
];

export const rubricCriteria = [
  { id: "c1", name: "1. Tư duy hệ thống & Đổi mới sáng tạo", weight: 20, desc: "Khả năng phân tích bức tranh tổng thể, đề xuất giải pháp có tính đột phá" },
  { id: "c2", name: "2. Năng lực số & Phân tích dữ liệu", weight: 20, desc: "Ứng dụng công nghệ/AI và ra quyết định dựa trên bằng chứng số liệu" },
  { id: "c3", name: "3. Lãnh đạo & Tạo ảnh hưởng", weight: 20, desc: "Khả năng truyền cảm hứng, giải quyết xung đột và điều phối đội ngũ" },
  { id: "c4", name: "4. Quản trị thực thi & Hướng tới kết quả", weight: 15, desc: "Lập kế hoạch hành động khả thi, quản trị rủi ro và đo lường KPI" },
  { id: "c5", name: "5. Đạo đức nghề nghiệp & Trách nhiệm xã hội (ESG)", weight: 10, desc: "Tuân thủ chuẩn mực đạo đức, phát triển bền vững" },
  { id: "c6", name: "6. Kỹ năng giao tiếp & Thuyết trình chuyên nghiệp", weight: 15, desc: "Lập luận mạch lạc, phản biện sắc bén, thần thái tự tin" },
];

export const getScoringCaseById = (id: string): ManualScoringItem | undefined => {
  return mockScoringCases.find((c) => c.caseId === id);
};