-- 報名欄位調整：拿掉電話必填、加入 Line ID 與匯款末四碼（兩者選填）

ALTER TABLE registrations ALTER COLUMN phone DROP NOT NULL;

ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS line_id text,
  ADD COLUMN IF NOT EXISTS transfer_last4 text;

-- 末四碼若有填必須剛好 4 位數字
ALTER TABLE registrations DROP CONSTRAINT IF EXISTS registrations_transfer_last4_check;
ALTER TABLE registrations ADD CONSTRAINT registrations_transfer_last4_check
  CHECK (transfer_last4 IS NULL OR transfer_last4 ~ '^[0-9]{4}$');

-- 重建 RPC：phone 退場、新增 line_id / transfer_last4（皆選填）
DROP FUNCTION IF EXISTS register_for_course(text, text, text, text);

CREATE OR REPLACE FUNCTION register_for_course(
  p_slug            text,
  p_name            text,
  p_email           text,
  p_line_id         text DEFAULT NULL,
  p_transfer_last4  text DEFAULT NULL
) RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_course_id uuid;
  v_capacity  int;
  v_status    text;
  v_count     int;
BEGIN
  SELECT id, capacity, status
    INTO v_course_id, v_capacity, v_status
    FROM courses
    WHERE slug = p_slug
    FOR UPDATE;

  IF v_course_id IS NULL THEN
    RETURN json_build_object('error','course_not_found');
  END IF;

  IF v_status <> 'published' THEN
    RETURN json_build_object('error','course_not_open');
  END IF;

  SELECT COUNT(*) INTO v_count
    FROM registrations
    WHERE course_id = v_course_id AND status <> 'cancelled';

  IF v_count >= v_capacity THEN
    RETURN json_build_object('error','full');
  END IF;

  BEGIN
    INSERT INTO registrations (course_id, name, email, line_id, transfer_last4)
    VALUES (
      v_course_id,
      p_name,
      p_email,
      NULLIF(btrim(p_line_id), ''),
      NULLIF(btrim(p_transfer_last4), '')
    );
  EXCEPTION
    WHEN unique_violation THEN
      RETURN json_build_object('error','duplicate');
    WHEN check_violation THEN
      RETURN json_build_object('error','bad_last4');
  END;

  RETURN json_build_object('ok', true, 'course_id', v_course_id);
END;
$$;

REVOKE ALL ON FUNCTION register_for_course(text, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION register_for_course(text, text, text, text, text) TO anon, authenticated, service_role;
