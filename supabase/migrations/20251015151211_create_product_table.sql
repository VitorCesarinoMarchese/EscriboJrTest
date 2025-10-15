CREATE TABLE product (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price numeric(10,2) NOT NULL,
  category text,
  stock integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TRIGGER product_updated_at
BEFORE UPDATE ON product
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_product_category ON product(category);
CREATE INDEX idx_product_name ON product(name);
