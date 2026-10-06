import type { ExamSchedule } from "@/types/admin";

export interface ScheduleItem extends ExamSchedule {
  name: string;
  assignedCount: number;
}

export const mockSchedules: ScheduleItem[] = [
  {
    id: "sch-001",
    exam_id: "exam-vong-1",
    name: "Ca 01 - Sáng Thứ Bảy (07/11/2026)",
    opens_at: "2026-11-07T08:30:00+07:00",
    closes_at: "2026-11-07T09:30:00+07:00",
    capacity: 100,
    assignedCount: 85,
    revision: 1,
  },
  {
    id: "sch-002",
    exam_id: "exam-vong-1",
    name: "Ca 02 - Chiều Thứ Bảy (07/11/2026)",
    opens_at: "2026-11-07T14:30:00+07:00",
    closes_at: "2026-11-07T15:30:00+07:00",
    capacity: 100,
    assignedCount: 92,
    revision: 1,
  },
  {
    id: "sch-003",
    exam_id: "exam-vong-1",
    name: "Ca 03 - Sáng Chủ Nhật (08/11/2026)",
    opens_at: "2026-11-08T09:00:00+07:00",
    closes_at: "2026-11-08T10:00:00+07:00",
    capacity: 100,
    assignedCount: 78,
    revision: 1,
  },
  {
    id: "sch-004",
    exam_id: "exam-vong-1",
    name: "Ca 04 - Chiều Chủ Nhật (08/11/2026) [Dự phòng]",
    opens_at: "2026-11-08T15:00:00+07:00",
    closes_at: "2026-11-08T16:00:00+07:00",
    capacity: 100,
    assignedCount: 15,
    revision: 1,
  },
];

export const getScheduleById = (id: string): ScheduleItem | undefined => {
  return mockSchedules.find((s) => s.id === id);
};