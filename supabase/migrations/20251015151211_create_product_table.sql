-- CREATE TABLE
CREATE TABLE product (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price numeric(10,2) NOT NULL,
  category text,
  stock integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);



-- FUNCTIONS AND TRIGGERS
CREATE TRIGGER product_updated_at
BEFORE UPDATE ON product
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE product ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable insert for service_role only" ON product
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Enable read access for all users" ON product
  FOR SELECT
  USING (true);

-- INDEXS
CREATE INDEX idx_product_category ON product(category);
CREATE INDEX idx_product_name ON product(name);
