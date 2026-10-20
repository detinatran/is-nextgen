-- Video giới thiệu không còn bắt buộc khi đăng ký; thí sinh nộp bổ sung sau khi đăng nhập, trước hạn của vòng.
-- Hạn nộp video riêng cho từng cuộc thi; để trống thì dùng hạn đăng ký.
ALTER TABLE competitions ADD COLUMN video_closes_at timestamptz;

-- Hồ sơ đã nộp chỉ cần mã thí sinh; video có thể bổ sung sau.
CREATE OR REPLACE FUNCTION check_submitted_registration() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.state='SUBMITTED' AND NOT EXISTS(SELECT 1 FROM candidates WHERE id=NEW.candidate_id AND candidate_code IS NOT NULL) THEN
  RAISE EXCEPTION 'submission requires public candidate code' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END $$;

-- Sau khi nộp hồ sơ: được gắn video lần đầu (INSERT), nhưng video đã gắn thì vẫn niêm phong (không sửa, không xoá).
CREATE OR REPLACE FUNCTION protect_video_binding() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_registration uuid; v_state text;
BEGIN
 v_registration:=CASE WHEN TG_OP='DELETE' THEN OLD.registration_id ELSE NEW.registration_id END;
 IF TG_OP='UPDATE' AND NEW.registration_id<>OLD.registration_id THEN RAISE EXCEPTION 'video reparent forbidden' USING ERRCODE='23514'; END IF;
 SELECT state INTO v_state FROM registrations WHERE id=v_registration FOR UPDATE;
 IF v_state='SUBMITTED' AND TG_OP<>'INSERT' THEN RAISE EXCEPTION 'submitted video sealed' USING ERRCODE='23514'; END IF;
 RETURN CASE WHEN TG_OP='DELETE' THEN OLD ELSE NEW END;
END $$;
