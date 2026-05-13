-- 支援課程「整期 / 單堂」報名
-- courses.single_session_price：純文字提示（例如 $500/堂），NULL 表示不開放單堂報名
-- registrations.session_ids：NULL 表示整期；非空 array 表示報名指定的單堂

ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS single_session_price text;

ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS session_ids uuid[];

-- 更新 RPC：多帶 p_session_ids
DROP FUNCTION IF EXISTS register_for_course(text, text, text, text, text, uuid);

CREATE OR REPLACE FUNCTION register_for_course(
  p_slug            text,
  p_name            text,
  p_email           text,
  p_line_id         text DEFAULT NULL,
  p_transfer_last4  text DEFAULT NULL,
  p_user_id         uuid DEFAULT NULL,
  p_session_ids     uuid[] DEFAULT NULL
) RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_course_id uuid;
  v_capacity  int;
  v_status    text;
  v_count     int;
BEGIN
  SELECT id, capacity, status INTO v_course_id, v_capacity, v_status
    FROM courses WHERE slug = p_slug FOR UPDATE;
  IF v_course_id IS NULL THEN RETURN json_build_object('error','course_not_found'); END IF;
  IF v_status <> 'published' THEN RETURN json_build_object('error','course_not_open'); END IF;
  IF p_user_id IS NOT NULL THEN
    PERFORM 1 FROM registrations
      WHERE course_id = v_course_id AND user_id = p_user_id AND status <> 'cancelled';
    IF FOUND THEN RETURN json_build_object('error','duplicate'); END IF;
  END IF;
  SELECT COUNT(*) INTO v_count FROM registrations
    WHERE course_id = v_course_id AND status <> 'cancelled';
  IF v_count >= v_capacity THEN RETURN json_build_object('error','full'); END IF;
  BEGIN
    INSERT INTO registrations (course_id, name, email, line_id, transfer_last4, user_id, session_ids)
    VALUES (v_course_id, p_name, p_email,
            NULLIF(btrim(p_line_id),''), NULLIF(btrim(p_transfer_last4),''),
            p_user_id, p_session_ids);
  EXCEPTION
    WHEN unique_violation THEN RETURN json_build_object('error','duplicate');
    WHEN check_violation THEN RETURN json_build_object('error','bad_last4');
  END;
  RETURN json_build_object('ok', true);
END;
$$;

REVOKE ALL ON FUNCTION register_for_course(text, text, text, text, text, uuid, uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION register_for_course(text, text, text, text, text, uuid, uuid[])
  TO anon, authenticated, service_role;
