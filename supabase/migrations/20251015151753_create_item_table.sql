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

CREATE INDEX idx_item_order_id ON item(order_id);
CREATE INDEX idx_item_product_id ON item(product_id);
