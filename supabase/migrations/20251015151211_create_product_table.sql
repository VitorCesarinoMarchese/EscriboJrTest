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


ALTER TABLE "order" ENABLE ROW LEVEL SECURITY;

alter policy "Enable insert for authenticated users only" on "public"."product"
to service_role
using (
  (auth.role() = 'service_role'::text)
) with check (
  (auth.role() = 'service_role'::text)
);

alter policy "Enable read access for all users" on "public"."product"
to public
using (
  true
);

CREATE INDEX idx_product_category ON product(category);
CREATE INDEX idx_product_name ON product(name);
