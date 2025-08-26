CREATE OR REPLACE VIEW view_ventas_productos_categorias AS
SELECT
    t.transaction_id,
    t.date AS transaction_date,
    t.tracking_number,
    t.tax_type,
    p.person_id AS client_id,
    p.name AS client_name,
    p.company_name AS client_company_name,
    i.item_id,
    i.product_id,
    i.quantity,
    i.price AS item_price,
    prod.name AS product_name,
    prod.code AS product_code,
    cat.category_id,
    cat.name AS category_name,
    (i.quantity * i.price) AS item_total,
    COALESCE(SUM(e.price), 0) AS total_extras_discounts
FROM
    transaction t
LEFT JOIN
    person p ON t.person_id = p.person_id
LEFT JOIN
    items i ON t.transaction_id = i.transaction_id
LEFT JOIN
    product prod ON i.product_id = prod.product_id
LEFT JOIN
    category cat ON prod.category_id = cat.category_id
LEFT JOIN
    extras e ON t.transaction_id = e.transaction_id AND e.type IN ('Envio', 'Mano de obra', 'Descuento')
WHERE
    t.is_sale = TRUE
GROUP BY
    t.transaction_id, t.date, t.tracking_number, t.tax_type,
    p.person_id, p.name, p.company_name, i.item_id, i.product_id, i.quantity, i.price,
    prod.name, prod.code, cat.category_id, cat.name;
