export interface LiveAttemptItem {
  id: string;
  candidateCode: string;
  fullName: string;
  studentId: string;
  scheduleName: string;
  startedAt: string;
  answeredCount: number;
  totalQuestions: number;
  tabSwitchCount: number;
  copyPasteCount: number;
  status: "ACTIVE" | "FINALIZED" | "DISQUALIFIED";
  lastHeartbeat: string;
}

export const mockLiveAttempts: LiveAttemptItem[] = [
  {
    id: "att-001",
    candidateCode: "CAND-00101",
    fullName: "Nguyễn Hoàng Nam",
    studentId: "22070145",
    scheduleName: "Ca 01 - Sáng T7 (07/11 08:30)",
    startedAt: "08:31:12",
    answeredCount: 28,
    totalQuestions: 40,
    tabSwitchCount: 0,
    copyPasteCount: 0,
    status: "ACTIVE",
    lastHeartbeat: "3s trước",
  },
  {
    id: "att-002",
    candidateCode: "CAND-00102",
    fullName: "Trần Thị Mai Anh",
    studentId: "23041088",
    scheduleName: "Ca 01 - Sáng T7 (07/11 08:30)",
    startedAt: "08:30:45",
    answeredCount: 35,
    totalQuestions: 40,
    tabSwitchCount: 3,
    copyPasteCount: 1,
    status: "ACTIVE",
    lastHeartbeat: "1s trước",
  },
  {
    id: "att-003",
    candidateCode: "CAND-00103",
    fullName: "Lê Minh Tuấn",
    studentId: "22070982",
    scheduleName: "Ca 01 - Sáng T7 (07/11 08:30)",
    startedAt: "08:32:00",
    answeredCount: 40,
    totalQuestions: 40,
    tabSwitchCount: 0,
    copyPasteCount: 0,
    status: "FINALIZED",
    lastHeartbeat: "Đã nộp bài (09:12)",
  },
  {
    id: "att-004",
    candidateCode: "CAND-00105",
    fullName: "Vũ Quốc Bảo",
    studentId: "22051120",
    scheduleName: "Ca 01 - Sáng T7 (07/11 08:30)",
    startedAt: "08:30:15",
    answeredCount: 19,
    totalQuestions: 40,
    tabSwitchCount: 6,
    copyPasteCount: 4,
    status: "ACTIVE",
    lastHeartbeat: "5s trước",
  },
];

export const getLiveAttemptById = (id: string): LiveAttemptItem | undefined => {
  return mockLiveAttempts.find((a) => a.id === id);
};