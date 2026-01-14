CREATE TABLE board_access_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,
  code_salt TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX board_access_codes_board_id_unique
  ON board_access_codes (board_id);

ALTER TABLE board_access_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY board_access_codes_no_public_access ON board_access_codes
  FOR ALL USING (false) WITH CHECK (false);
