export interface AssignmentItem {
  id: string;
  candidateCode: string;
  fullName: string;
  studentId: string;
  school: string;
  scheduleId: string;
  scheduleName: string;
  assignedAt: string;
  historyCount: number;
}

export const mockAssignments: AssignmentItem[] = [
  {
    id: "asg-001",
    candidateCode: "CAND-00101",
    fullName: "Nguyễn Hoàng Nam",
    studentId: "22070145",
    school: "Trường Quốc tế - ĐHQGHN",
    scheduleId: "sch-001",
    scheduleName: "Ca 01 - Sáng T7 (07/11 08:30)",
    assignedAt: "01/10/2026 10:00",
    historyCount: 0,
  },
  {
    id: "asg-002",
    candidateCode: "CAND-00102",
    fullName: "Trần Thị Mai Anh",
    studentId: "23041088",
    school: "Đại học Ngoại Thương",
    scheduleId: "sch-001",
    scheduleName: "Ca 01 - Sáng T7 (07/11 08:30)",
    assignedAt: "01/10/2026 11:30",
    historyCount: 1,
  },
  {
    id: "asg-003",
    candidateCode: "CAND-00103",
    fullName: "Lê Minh Tuấn",
    studentId: "22070982",
    school: "Trường Quốc tế - ĐHQGHN",
    scheduleId: "sch-002",
    scheduleName: "Ca 02 - Chiều T7 (07/11 14:30)",
    assignedAt: "02/10/2026 09:00",
    historyCount: 0,
  },
  {
    id: "asg-004",
    candidateCode: "CAND-00104",
    fullName: "Phạm Hải Đăng",
    studentId: "21050321",
    school: "Đại học Kinh tế Quốc dân",
    scheduleId: "sch-003",
    scheduleName: "Ca 03 - Sáng CN (08/11 09:00)",
    assignedAt: "03/10/2026 14:15",
    historyCount: 0,
  },
];

export const getAssignmentsBySchedule = (scheduleId: string): AssignmentItem[] => {
  return mockAssignments.filter((a) => a.scheduleId === scheduleId);
};