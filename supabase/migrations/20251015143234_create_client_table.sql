-- CREATE TABLE
CREATE TABLE client (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_uid uuid NOT NULL,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  address text,
  is_active boolean DEFAULT true,
  birth_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- FUNCTIOS AND TRIGGERS
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER client_updated_at
BEFORE UPDATE ON client
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE client ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clients_user_is_owner" ON client
  FOR SELECT USING (client_uid = auth.uid());

CREATE POLICY "clients_user_can_insert" ON client
  FOR INSERT WITH CHECK (client_uid = auth.uid());

CREATE POLICY "clients_user_can_update" ON client
  FOR UPDATE USING (client_uid = auth.uid());

CREATE POLICY "clients_user_can_delete" ON client
  FOR DELETE USING (client_uid = auth.uid());

CREATE POLICY "clients_service_full_access" ON client
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- INDEXS
CREATE UNIQUE INDEX idx_client_email ON client(email);
CREATE INDEX idx_client_client_uid ON client(client_uid);
