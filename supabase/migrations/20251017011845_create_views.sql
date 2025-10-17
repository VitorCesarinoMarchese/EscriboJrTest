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

CREATE VIEW vw_clients_total_spends AS
SELECT
  c.id AS client_id,
  c.name AS client,
  SUM(o.total) AS total_spends
FROM "order" o
JOIN client c ON o.client_id = c.id
GROUP BY c.id, c.name
ORDER BY total_spends DESC;

CREATE VIEW vw_best_selling_products AS
SELECT
  p.id AS product_id,
  p.name AS prodct,
  SUM(i.amount) AS total_sells
FROM item i
JOIN product p ON i.product_id = p.id
GROUP BY p.id, p.name
ORDER BY total_sells DESC;
