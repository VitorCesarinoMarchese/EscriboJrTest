CREATE TABLE item (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES "order"(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES product(id),
  amount smallint NOT NULL,
  total numeric(10,2) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TRIGGER item_updated_at
BEFORE UPDATE ON item
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

