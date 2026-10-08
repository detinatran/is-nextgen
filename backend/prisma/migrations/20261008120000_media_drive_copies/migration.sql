-- Bản sao video thí sinh trên Google Drive (nextgen@vnuis.edu.vn).
-- media_objects là bất biến nên trạng thái đồng bộ nằm ở bảng riêng.
CREATE TABLE media_drive_copies (
  media_object_id  uuid PRIMARY KEY REFERENCES media_objects(id),
  drive_file_id    text NOT NULL UNIQUE,
  drive_md5        text NOT NULL,
  size_bytes       bigint NOT NULL,
  synced_at        timestamptz NOT NULL DEFAULT now(),
  local_deleted_at timestamptz
);
