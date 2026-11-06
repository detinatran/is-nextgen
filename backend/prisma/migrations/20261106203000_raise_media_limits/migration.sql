-- Raise video size limit to 900 MB (900_000_000 bytes) and duration to 150 seconds (2m30s)
ALTER TABLE media_objects DROP CONSTRAINT IF EXISTS media_objects_size_bytes_check;
ALTER TABLE media_objects ADD CONSTRAINT media_objects_size_bytes_check CHECK (size_bytes >= 1 AND size_bytes <= 900000000);

ALTER TABLE media_objects DROP CONSTRAINT IF EXISTS media_objects_duration_seconds_check;
ALTER TABLE media_objects ADD CONSTRAINT media_objects_duration_seconds_check CHECK (duration_seconds > 0 AND duration_seconds <= 150);
