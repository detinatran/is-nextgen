// Kiểm tra dữ liệu bước 1 của form đăng ký ở phía trình duyệt (server vẫn kiểm tra lại).
// Trả về mã lỗi theo tên ô; form dịch mã lỗi sang câu tiếng Việt/Anh.

export type FieldErrorCode =
  | "required"
  | "name"
  | "email"
  | "phone"
  | "studentId"
  | "facebook"
  | "dob"
  | "text";

const NAME = /^\p{L}[\p{L}\s.'-]*$/u;
const EMAIL = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;
const PHONE = /^\+?[0-9\s]{9,15}$/;
const STUDENT_ID = /^[A-Za-z0-9]{4,20}$/;
const FACEBOOK = /^(https?:\/\/)?((www|m|web)\.)?(facebook\.com|fb\.com)\/[^\s/?#][^\s]*$/i;
const UNSAFE = /[<>{}]/;

/** Chuẩn hoá link Facebook: thêm https:// nếu thí sinh dán thiếu. */
export function normalizeFacebook(value: string) {
  const v = value.trim();
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
}

export function validateProfile(get: (name: string) => string): Record<string, FieldErrorCode> {
  const errors: Record<string, FieldErrorCode> = {};
  const value = (name: string) => get(name).trim();
  const required = ["fullName", "email", "phone", "school", "dateOfBirth", "department", "major", "studentId", "facebook", "year"];
  for (const name of required) if (!value(name)) errors[name] = "required";

  const name = value("fullName");
  if (name && (name.length < 2 || !NAME.test(name))) errors.fullName = "name";
  if (value("email") && !EMAIL.test(value("email"))) errors.email = "email";
  if (value("phone") && !PHONE.test(value("phone"))) errors.phone = "phone";
  if (value("studentId") && !STUDENT_ID.test(value("studentId"))) errors.studentId = "studentId";
  if (value("facebook") && !FACEBOOK.test(value("facebook"))) errors.facebook = "facebook";
  for (const field of ["school", "department", "major", "nationality"]) {
    const v = value(field);
    if (v && (v.length < 2 || UNSAFE.test(v))) errors[field] = "text";
  }
  const dob = value("dateOfBirth");
  if (dob) {
    const year = Number(dob.slice(0, 4));
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dob) || year < 1970 || year > 2012) errors.dateOfBirth = "dob";
  }
  return errors;
}
