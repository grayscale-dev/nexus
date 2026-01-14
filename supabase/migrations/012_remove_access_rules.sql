DROP POLICY IF EXISTS board_roles_insert_via_rule ON board_roles;

CREATE OR REPLACE FUNCTION can_read_board(board_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM boards b
    WHERE b.id = can_read_board.board_id
      AND b.visibility = 'public'
      AND b.status = 'active'
  )
  OR (
    auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1
      FROM board_roles br
      WHERE br.board_id = can_read_board.board_id
        AND br.user_id = auth.uid()
    )
  );
$$;
