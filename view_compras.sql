CREATE OR REPLACE VIEW view_compras_detalladas AS
SELECT
    t.transaction_id,
    t.date,
    t.tracking_number,
    t.tax_type,
    
    -- Proveedor
    p.person_id,
    p.name AS person_name,
    p.company_name,
    p.email,
    p.phone,
    
    -- Transporte
    tc.name AS transport_company,
    t.transport_id,
    
    -- Monto total por ítems
    COALESCE(SUM(i.quantity * i.price), 0) AS total_items,
    
    -- Extras (envío + mano de obra)
    COALESCE(SUM(CASE 
        WHEN e.type IN ('Envio', 'Mano de obra', 'Otro') THEN e.price
        ELSE 0 END), 0) AS total_extras,
    
    -- Descuentos (restan)
    COALESCE(SUM(CASE 
        WHEN e.type = 'Descuento' THEN e.price
        ELSE 0 END), 0) AS total_descuentos,
    
    -- Total a pagar (items + extras - descuentos)
    COALESCE(SUM(i.quantity * i.price), 0) +
    COALESCE(SUM(CASE WHEN e.type IN ('Envio', 'Mano de obra', 'Otro') THEN e.price ELSE 0 END), 0) -
    COALESCE(SUM(CASE WHEN e.type = 'Descuento' THEN e.price ELSE 0 END), 0) AS total_a_pagar,
    
    -- Pagos realizados
    COALESCE(SUM(pay.amount), 0) AS total_pagado,
    
    -- Saldo restante
    COALESCE(SUM(i.quantity * i.price), 0) +
    COALESCE(SUM(CASE WHEN e.type IN ('Envio', 'Mano de obra', 'Otro') THEN e.price ELSE 0 END), 0) -
    COALESCE(SUM(CASE WHEN e.type = 'Descuento' THEN e.price ELSE 0 END), 0) -
    COALESCE(SUM(pay.amount), 0) AS saldo_restante
    
FROM transaction t
LEFT JOIN person p ON t.person_id = p.person_id
LEFT JOIN transport_companies tc ON t.transport_id = tc.company_id
LEFT JOIN items i ON t.transaction_id = i.transaction_id
LEFT JOIN extras e ON t.transaction_id = e.transaction_id
LEFT JOIN payments pay ON t.transaction_id = pay.transaction_id
WHERE t.is_sale = FALSE
GROUP BY
    t.transaction_id, t.date, t.tracking_number, t.tax_type,
    p.person_id, p.name, p.company_name, p.email, p.phone,
    tc.name, t.transport_id;
