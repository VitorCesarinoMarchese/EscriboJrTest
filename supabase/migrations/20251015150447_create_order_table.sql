-- ENUMS
CREATE TYPE order_status AS ENUM (
  'aguardando_pagamento',
  'gerando_nota_fiscal',
  'pedido_recebido',
  'enviado_transportadora',
  'em_transito',
  'entregue'
);

CREATE TYPE payment_method AS ENUM (
  'credito',
  'pix',
  'boleto'
);

-- CREATE TABLE
CREATE TABLE "order" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES client(id) ON DELETE CASCADE,
  order_date timestamptz DEFAULT now(),
  delivery_address text,
  status order_status DEFAULT 'aguardando_pagamento',
  payment_method payment_method,
  total numeric(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- VIEWS
CREATE VIEW vw_order_with_details AS
SELECT
  o.id AS order_id,
  c.name AS client,
  o.total,
  json_agg(json_build_object(
      'product', p.name,
      'amount', i.amount,
      'total', i.total
  )) AS itens
FROM "order" o
JOIN client c ON o.client_id = c.id
JOIN item i ON i.order_id = o.id
JOIN product p ON i.product_id = p.id
GROUP BY o.id, c.name, o.total;

-- FUNCTIONS AND TRIGGERS
CREATE OR REPLACE FUNCTION update_order_status(order_id uuid, new_status order_status)
RETURNS void AS $$
BEGIN
  UPDATE "order"
  SET status = new_status
  WHERE id = order_id;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER order_updated_at
BEFORE UPDATE ON "order"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE "order" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders_user_is_owner" ON "order"
  FOR SELECT USING (client_id IN (SELECT id FROM client WHERE client_uid = auth.uid()));

CREATE POLICY "orders_user_can_insert" ON "order"
  FOR INSERT WITH CHECK (client_id IN (SELECT id FROM client WHERE client_uid = auth.uid()));

CREATE POLICY "orders_user_can_update" ON "order"
  FOR UPDATE USING (client_id IN (SELECT id FROM client WHERE client_uid = auth.uid()));

-- INDEXS
CREATE INDEX idx_order_client_id ON "order"(client_id);
CREATE INDEX idx_order_status ON "order"(status);
CREATE INDEX idx_order_order_date ON "order"(order_date);
