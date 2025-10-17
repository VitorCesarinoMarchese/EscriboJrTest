-- CREATE TABLE
CREATE TABLE item (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES "order"(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES product(id),
  amount smallint NOT NULL,
  total numeric(10,2) NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- FUNCTIONS AND TRIGGERS
CREATE OR REPLACE FUNCTION update_total()
RETURNS TRIGGER AS $$
BEGIN
  NEW.total := (
    SELECT price * NEW.amount
    FROM product
    WHERE id = NEW.product_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_total_trigger
BEFORE INSERT OR UPDATE ON item
FOR EACH ROW
EXECUTE FUNCTION update_total();

CREATE OR REPLACE FUNCTION update_total_order()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE "order"
  SET total = COALESCE(
    (SELECT SUM(total) FROM item WHERE order_id = NEW.order_id),
    0
  )
  WHERE id = NEW.order_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_total_order_trigger
AFTER INSERT OR UPDATE OR DELETE ON item
FOR EACH ROW
EXECUTE FUNCTION update_total_order();


CREATE TRIGGER item_updated_at
BEFORE UPDATE ON item
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE item ENABLE ROW LEVEL SECURITY;

CREATE POLICY "item_user_is_owner" ON item
  FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM "order"
      WHERE client_id IN (
        SELECT id FROM client WHERE client_uid = auth.uid()
      )
    )
  );

CREATE POLICY "item_user_can_insert" ON item
  FOR INSERT
  WITH CHECK (
    order_id IN (
      SELECT id FROM "order"
      WHERE client_id IN (
        SELECT id FROM client WHERE client_uid = auth.uid()
      )
    )
  );

CREATE POLICY "item_user_can_update" ON item
  FOR UPDATE
  USING (
    order_id IN (
      SELECT id FROM "order"
      WHERE client_id IN (
        SELECT id FROM client WHERE client_uid = auth.uid()
      )
    )
  );

-- INDEXS
CREATE INDEX idx_item_order_id ON item(order_id);
CREATE INDEX idx_item_product_id ON item(product_id);
