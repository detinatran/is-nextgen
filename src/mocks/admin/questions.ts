import type { QuestionVersion, QuestionOption } from "@/types/admin";

export interface QuestionItem extends QuestionVersion {
  poolName: string;
}

export const mockQuestions: QuestionItem[] = [
  {
    id: "qv-001",
    question_id: "q-001",
    version: 1,
    state: "FROZEN",
    prompt: "Trong bối cảnh chuyển đổi số, mô hình quản trị nào sau đây đề cao tính linh hoạt và khả năng tự tổ chức của các nhóm liên chức năng (cross-functional teams)?",
    difficulty: "EASY",
    revision: 1,
    created_by_user_id: "u-admin-01",
    frozen_at: "2026-10-01T00:00:00Z",
    poolName: "Kiến thức quản trị nền tảng",
    options: [
      { id: "opt-1", question_version_id: "qv-001", position: 1, text: "Mô hình Agile / Scrum", is_correct: true },
      { id: "opt-2", question_version_id: "qv-001", position: 2, text: "Mô hình Thác nước (Waterfall)", is_correct: false },
      { id: "opt-3", question_version_id: "qv-001", position: 3, text: "Mô hình Phân cấp thứ bậc truyền thống (Bureaucracy)", is_correct: false },
      { id: "opt-4", question_version_id: "qv-001", position: 4, text: "Mô hình Quản trị chuyên chế (Autocratic)", is_correct: false },
    ],
  },
  {
    id: "qv-002",
    question_id: "q-002",
    version: 2,
    state: "FROZEN",
    prompt: "Một nhà quản trị đối mặt với tình huống: Chi phí vận hành tăng 15% trong khi doanh thu giảm 5% do đối thủ cạnh tranh ứng dụng AI tối ưu hóa chuỗi cung ứng. Quyết định chiến lược ưu tiên ngắn hạn là gì?",
    difficulty: "HARD",
    revision: 2,
    created_by_user_id: "u-admin-01",
    frozen_at: "2026-10-02T10:00:00Z",
    poolName: "Tư duy phân tích & Ra quyết định",
    options: [
      { id: "opt-5", question_version_id: "qv-002", position: 1, text: "Cắt giảm ngay 20% nhân sự để bù đắp thâm hụt dòng tiền", is_correct: false },
      { id: "opt-6", question_version_id: "qv-002", position: 2, text: "Rà soát điểm nghẽn chi phí chuỗi cung ứng, lập dự án thí điểm AI tối ưu tồn kho", is_correct: true },
      { id: "opt-7", question_version_id: "qv-002", position: 3, text: "Vay vốn ngắn hạn ngân hàng để mở rộng chiến dịch quảng bá đại trà", is_correct: false },
      { id: "opt-8", question_version_id: "qv-002", position: 4, text: "Hạ giá bán sản phẩm xuống thấp hơn đối thủ 10%", is_correct: false },
    ],
  },
  {
    id: "qv-003",
    question_id: "q-003",
    version: 1,
    state: "DRAFT",
    prompt: "Chỉ số ROI (Return on Investment) của một dự án đầu tư phần mềm quản trị được tính theo công thức chuẩn nào?",
    difficulty: "MEDIUM",
    revision: 1,
    created_by_user_id: "u-admin-02",
    frozen_at: null,
    poolName: "Tư duy số liệu & Tài chính",
    options: [
      { id: "opt-9", question_version_id: "qv-003", position: 1, text: "(Lợi nhuận ròng / Chi phí đầu tư) x 100%", is_correct: true },
      { id: "opt-10", question_version_id: "qv-003", position: 2, text: "(Doanh thu / Chi phí đầu tư) x 100%", is_correct: false },
      { id: "opt-11", question_version_id: "qv-003", position: 3, text: "(Dòng tiền thuần / Vốn chủ sở hữu) x 100%", is_correct: false },
      { id: "opt-12", question_version_id: "qv-003", position: 4, text: "Tổng lợi nhuận gộp trừ đi thuế doanh nghiệp", is_correct: false },
    ],
  },
  {
    id: "qv-004",
    question_id: "q-004",
    version: 1,
    state: "FROZEN",
    prompt: "Khi áp dụng mô hình ADKAR để quản trị thay đổi tổ chức, giai đoạn nào đến đầu tiên?",
    difficulty: "MEDIUM",
    revision: 1,
    created_by_user_id: "u-admin-01",
    frozen_at: "2026-10-01T15:00:00Z",
    poolName: "Kiến thức quản trị nền tảng",
    options: [
      { id: "opt-13", question_version_id: "qv-004", position: 1, text: "Awareness (Nhận thức nhu cầu thay đổi)", is_correct: true },
      { id: "opt-14", question_version_id: "qv-004", position: 2, text: "Desire (Mong muốn tham gia thay đổi)", is_correct: false },
      { id: "opt-15", question_version_id: "qv-004", position: 3, text: "Knowledge (Kiến thức cách thức thay đổi)", is_correct: false },
      { id: "opt-16", question_version_id: "qv-004", position: 4, text: "Ability (Khả năng thực hiện thay đổi)", is_correct: false },
    ],
  },
  {
    id: "qv-005",
    question_id: "q-005",
    version: 1,
    state: "DRAFT",
    prompt: "Trong phân tích dữ liệu, thuật ngữ 'Feature Engineering' đề cập đến quy trình nào?",
    difficulty: "MEDIUM",
    revision: 1,
    created_by_user_id: "u-admin-03",
    frozen_at: null,
    poolName: "Tư duy số liệu & Tài chính",
    options: [
      { id: "opt-17", question_version_id: "qv-005", position: 1, text: "Tạo ra các đặc trưng mới từ dữ liệu thô để cải thiện hiệu suất mô hình", is_correct: true },
      { id: "opt-18", question_version_id: "qv-005", position: 2, text: "Lựa chọn thuật toán Machine Learning phù hợp nhất", is_correct: false },
      { id: "opt-19", question_version_id: "qv-005", position: 3, text: "Điều chỉnh hyperparameters của mô hình", is_correct: false },
      { id: "opt-20", question_version_id: "qv-005", position: 4, text: "Trực quan hóa dữ liệu đầu vào", is_correct: false },
    ],
  },
];

export const getPools = (): string[] => {
  const pools = new Set(mockQuestions.map((q) => q.poolName).filter(Boolean));
  return Array.from(pools).sort();
};

export type QuestionDifficulty = "EASY" | "MEDIUM" | "HARD";

export const getDifficulties = (): QuestionDifficulty[] => {
  return ["EASY", "MEDIUM", "HARD"];
};

export const getQuestionById = (id: string): QuestionItem | undefined => {
  return mockQuestions.find((q) => q.id === id);
};