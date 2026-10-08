import type { DuplicateReview } from "@/types/admin";

export interface DuplicateReviewItem extends DuplicateReview {
  conflictDetails: {
    field: string;
    value: string;
    candidates: {
      id: string;
      code: string;
      name: string;
      school: string;
      submittedAt: string;
      profile: {
        student_id: string;
        email: string;
        phone: string;
        facebook: string;
      };
    }[];
  };
}

export const mockDuplicates: DuplicateReviewItem[] = [
  {
    id: "dup-001",
    state: "OPEN",
    disposition: null,
    reviewed_by_user_id: null,
    reviewed_at: null,
    revision: 1,
    signals: {
      similarity_score: 0.95,
      matched_fields: ["student_id", "phone"],
      candidates: [
        { candidate_id: "c-001", candidate_code: "CAND-00101", full_name: "Nguyễn Hoàng Nam", student_id: "22070145", school: "Trường Quốc tế - ĐHQGHN", email: "nam.nh22@isvnu.vn", phone: "0912345678" },
        { candidate_id: "c-099", candidate_code: "CAND-00199", full_name: "Nguyễn Hoàng Nam (Bản nộp lại)", student_id: "22070145", school: "Trường Quốc tế - ĐHQGHN", email: "nam.nh22@isvnu.vn", phone: "0912345678" },
      ],
    },
    conflictDetails: {
      field: "Mã số sinh viên (MSSV) & Số điện thoại",
      value: "MSSV: 22070145 • SĐT: 0912345678",
      candidates: [
        {
          id: "c-001",
          code: "CAND-00101",
          name: "Nguyễn Hoàng Nam",
          school: "Trường Quốc tế - ĐHQGHN",
          submittedAt: "01/10/2026 09:15",
          profile: {
            student_id: "22070145",
            email: "nam.nh22@isvnu.vn",
            phone: "0912345678",
            facebook: "https://facebook.com/nam.nguyen",
          },
        },
        {
          id: "c-099",
          code: "CAND-00199",
          name: "Nguyễn Hoàng Nam (Bản nộp lại)",
          school: "Trường Quốc tế - ĐHQGHN",
          submittedAt: "02/10/2026 14:20",
          profile: {
            student_id: "22070145",
            email: "nam.nh22@isvnu.vn",
            phone: "0912345678",
            facebook: "https://facebook.com/nam.nguyen",
          },
        },
      ],
    },
  },
  {
    id: "dup-002",
    state: "OPEN",
    disposition: null,
    reviewed_by_user_id: null,
    reviewed_at: null,
    revision: 1,
    signals: {
      similarity_score: 0.88,
      matched_fields: ["facebook", "email"],
      candidates: [
        { candidate_id: "c-002", candidate_code: "CAND-00102", full_name: "Trần Thị Mai Anh", student_id: "23041088", school: "Đại học Ngoại Thương", email: "maianh.tran@ftu.edu.vn", phone: "0988776655" },
        { candidate_id: "c-088", candidate_code: "CAND-00188", full_name: "Mai Anh Trần", student_id: "23041089", school: "Đại học Ngoại Thương", email: "maianh.tran@ftu.edu.vn", phone: "0988776656" },
      ],
    },
    conflictDetails: {
      field: "Link Facebook cá nhân & Email",
      value: "fb.com/maianh.ftu",
      candidates: [
        {
          id: "c-002",
          code: "CAND-00102",
          name: "Trần Thị Mai Anh",
          school: "Đại học Ngoại Thương",
          submittedAt: "01/10/2026 10:45",
          profile: {
            student_id: "23041088",
            email: "maianh.tran@ftu.edu.vn",
            phone: "0988776655",
            facebook: "https://facebook.com/maianh.ftu",
          },
        },
        {
          id: "c-088",
          code: "CAND-00188",
          name: "Mai Anh Trần",
          school: "Đại học Ngoại Thương",
          submittedAt: "03/10/2026 11:30",
          profile: {
            student_id: "23041089",
            email: "maianh.tran@ftu.edu.vn",
            phone: "0988776656",
            facebook: "https://facebook.com/maianh.ftu",
          },
        },
      ],
    },
  },
  {
    id: "dup-003",
    state: "OPEN",
    disposition: null,
    reviewed_by_user_id: null,
    reviewed_at: null,
    revision: 1,
    signals: {
      similarity_score: 0.92,
      matched_fields: ["student_id", "email"],
      candidates: [
        { candidate_id: "c-003", candidate_code: "CAND-00103", full_name: "Lê Minh Tuấn", student_id: "22070982", school: "Trường Quốc tế - ĐHQGHN", email: "tuan.lm22@isvnu.vn", phone: "0901234567" },
        { candidate_id: "c-150", candidate_code: "CAND-00250", full_name: "Tuấn Minh Lê", student_id: "22070982", school: "Trường Quốc tế - ĐHQGHN", email: "tuan.lm22@isvnu.vn", phone: "0901234568" },
      ],
    },
    conflictDetails: {
      field: "MSSV & Email",
      value: "MSSV: 22070982 • Email: tuan.lm22@isvnu.vn",
      candidates: [
        {
          id: "c-003",
          code: "CAND-00103",
          name: "Lê Minh Tuấn",
          school: "Trường Quốc tế - ĐHQGHN",
          submittedAt: "02/10/2026 15:00",
          profile: {
            student_id: "22070982",
            email: "tuan.lm22@isvnu.vn",
            phone: "0901234567",
            facebook: "https://facebook.com/tuan.le",
          },
        },
        {
          id: "c-150",
          code: "CAND-00250",
          name: "Tuấn Minh Lê",
          school: "Trường Quốc tế - ĐHQGHN",
          submittedAt: "04/10/2026 09:45",
          profile: {
            student_id: "22070982",
            email: "tuan.lm22@isvnu.vn",
            phone: "0901234568",
            facebook: "https://facebook.com/tuan.le.minh",
          },
        },
      ],
    },
  },
];

export const getDuplicateById = (id: string): DuplicateReviewItem | undefined => {
  return mockDuplicates.find((d) => d.id === id);
};