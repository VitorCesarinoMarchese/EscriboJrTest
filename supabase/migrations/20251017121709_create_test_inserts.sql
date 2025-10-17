INSERT INTO client (
  client_uid,
  name,
  email,
  address,
  birth_date
)
VALUES (
  'bdd66e51-de84-4d3e-b8d9-fcb4aa71c880',
  'Vitor Cesarino',
  'vitorcesarino1@gmail.com',
  'Rua das Pedras, 123, São Paulo - SP',
  '2006-07-12'
);

INSERT INTO product (
  name,
  price,
  category,
  stock
)VALUES
  ('Corda de Escalada Beal 9.8mm', 899.90, 'Equipamento', 12),
  ('Sapatilha La Sportiva Solution', 749.00, 'Calçados', 7),
  ('Magnésio em Pó 200g', 39.90, 'Acessórios', 50);

INSERT INTO "order" (
  client_id,
  delivery_address,
  status,
  payment_method
)
VALUES (
  (SELECT id FROM client WHERE email = 'vitorcesarino1@gmail.com'),
  'Rua das Pedras, 123, São Paulo - SP',
  'gerando_nota_fiscal',
  'pix'
);

INSERT INTO item (
  order_id,
  product_id,
  amount
)
VALUES
  (
    (SELECT id FROM "order" WHERE client_id = (SELECT id FROM client WHERE email = 'vitorcesarino1@gmail.com')),
    (SELECT id FROM product WHERE name = 'Corda de Escalada Beal 9.8mm'),
    1
  ),
  (
    (SELECT id FROM "order" WHERE client_id = (SELECT id FROM client WHERE email = 'vitorcesarino1@gmail.com')),
    (SELECT id FROM product WHERE name = 'Sapatilha La Sportiva Solution'),
    1
  ),
  (
    (SELECT id FROM "order" WHERE client_id = (SELECT id FROM client WHERE email = 'vitorcesarino1@gmail.com')),
    (SELECT id FROM product WHERE name = 'Magnésio em Pó 200g'),
    2
  );
