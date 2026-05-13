-- 報名時填匯款金額（單堂 vs 整期費用不同，要讓學生明確標示）
-- 整數，TWD 元，可為 NULL（尚未匯款）

ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS transfer_amount int
  CHECK (transfer_amount IS NULL OR transfer_amount > 0);

-- RPC 多收 p_transfer_amount
DROP FUNCTION IF EXISTS register_for_course(text, text, text, text, text, uuid, uuid[]);

CREATE OR REPLACE FUNCTION register_for_course(
  p_slug            text,
  p_name            text,
  p_email           text,
  p_line_id         text DEFAULT NULL,
  p_transfer_last4  text DEFAULT NULL,
  p_user_id         uuid DEFAULT NULL,
  p_session_ids     uuid[] DEFAULT NULL,
  p_transfer_amount int DEFAULT NULL
) RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_course_id uuid; v_capacity int; v_status text; v_count int;
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
    INSERT INTO registrations (course_id, name, email, line_id, transfer_last4, user_id, session_ids, transfer_amount)
    VALUES (v_course_id, p_name, p_email,
            NULLIF(btrim(p_line_id),''), NULLIF(btrim(p_transfer_last4),''),
            p_user_id, p_session_ids, p_transfer_amount);
  EXCEPTION
    WHEN unique_violation THEN RETURN json_build_object('error','duplicate');
    WHEN check_violation THEN RETURN json_build_object('error','bad_input');
  END;
  RETURN json_build_object('ok', true);
END;
$$;

REVOKE ALL ON FUNCTION register_for_course(text, text, text, text, text, uuid, uuid[], int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION register_for_course(text, text, text, text, text, uuid, uuid[], int)
  TO anon, authenticated, service_role;
