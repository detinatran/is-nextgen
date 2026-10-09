-- Quyết định của BTC khi rà soát hồ sơ trùng: nhóm trùng (loại trường + giá trị) -> hồ sơ được giữ lại
CREATE TABLE admin_duplicate_decisions (
 group_key text PRIMARY KEY CHECK (length(group_key) BETWEEN 1 AND 600),
 kept_candidate_id uuid NOT NULL REFERENCES candidates(id),
 decided_by_user_id uuid NOT NULL REFERENCES users(id),
 decided_at timestamptz NOT NULL DEFAULT now()
);
