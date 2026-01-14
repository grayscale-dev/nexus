ALTER TABLE board_roles DROP CONSTRAINT IF EXISTS workspace_roles_assigned_via_check;
ALTER TABLE board_roles DROP CONSTRAINT IF EXISTS board_roles_assigned_via_check;

ALTER TABLE board_roles
  ADD CONSTRAINT board_roles_assigned_via_check
  CHECK (assigned_via IN ('explicit', 'rule', 'access_code'));
