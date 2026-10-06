export interface Round1ResultItem {
  id: string;
  rank: number;
  candidateCode: string;
  fullName: string;
  studentId: string;
  school: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  timeTakenSeconds: number; // For tie-breaking
  submittedAt: string;
  isTop40: boolean;
  status: "QUALIFIED" | "ELIMINATED";
}

export const mockRound1Results: Round1ResultItem[] = [
  {
    id: "res-001",
    rank: 1,
    candidateCode: "CAND-00101",
    fullName: "Nguyễn Hoàng Nam",
    studentId: "22070145",
    school: "Trường Quốc tế - ĐHQGHN",
    score: 95.0,
    correctAnswers: 38,
    totalQuestions: 40,
    timeTakenSeconds: 2145, // 35m 45s
    submittedAt: "07/11/2026 09:05:45",
    isTop40: true,
    status: "QUALIFIED",
  },
  {
    id: "res-002",
    rank: 2,
    candidateCode: "CAND-00102",
    fullName: "Trần Thị Mai Anh",
    studentId: "23041088",
    school: "Đại học Ngoại Thương",
    score: 92.5,
    correctAnswers: 37,
    totalQuestions: 40,
    timeTakenSeconds: 2310, // 38m 30s
    submittedAt: "07/11/2026 09:08:30",
    isTop40: true,
    status: "QUALIFIED",
  },
  {
    id: "res-003",
    rank: 3,
    candidateCode: "CAND-00103",
    fullName: "Lê Minh Tuấn",
    studentId: "22070982",
    school: "Trường Quốc tế - ĐHQGHN",
    score: 90.0,
    correctAnswers: 36,
    totalQuestions: 40,
    timeTakenSeconds: 1980, // 33m 00s
    submittedAt: "07/11/2026 09:03:00",
    isTop40: true,
    status: "QUALIFIED",
  },
  {
    id: "res-004",
    rank: 4,
    candidateCode: "CAND-00104",
    fullName: "Phạm Hải Đăng",
    studentId: "21050321",
    school: "Đại học Kinh tế Quốc dân",
    score: 87.5,
    correctAnswers: 35,
    totalQuestions: 40,
    timeTakenSeconds: 2450,
    submittedAt: "07/11/2026 09:10:50",
    isTop40: true,
    status: "QUALIFIED",
  },
  {
    id: "res-040",
    rank: 40,
    candidateCode: "CAND-00140",
    fullName: "Hoàng Đức Anh",
    studentId: "23071190",
    school: "Đại học Thương Mại",
    score: 72.5,
    correctAnswers: 29,
    totalQuestions: 40,
    timeTakenSeconds: 3100,
    submittedAt: "07/11/2026 09:21:40",
    isTop40: true,
    status: "QUALIFIED",
  },
  {
    id: "res-041",
    rank: 41,
    candidateCode: "CAND-00141",
    fullName: "Đỗ Bích Ngọc",
    studentId: "22040512",
    school: "Học viện Ngân hàng",
    score: 70.0,
    correctAnswers: 28,
    totalQuestions: 40,
    timeTakenSeconds: 2890,
    submittedAt: "07/11/2026 09:18:10",
    isTop40: false,
    status: "ELIMINATED",
  },
];

export const getRound1ResultById = (id: string): Round1ResultItem | undefined => {
  return mockRound1Results.find((r) => r.id === id);
};

export const getTop40 = (): Round1ResultItem[] => {
  return mockRound1Results.filter((r) => r.isTop40);
};