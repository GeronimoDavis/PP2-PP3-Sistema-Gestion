CREATE OR REPLACE VIEW view_ventas_detalladas AS
SELECT
    t.transaction_id,
    t.date,
    t.tracking_number,
    t.tax_type,
    
    -- Cliente
    p.person_id,
    p.name AS person_name,
    p.company_name,
    p.email,
    p.phone,
    
    -- Transporte
    tc.name AS transport_company,
    t.transport_id,
    
    -- Monto total por ítems (calculado por separado para evitar duplicación)
    COALESCE(items_totals.total_items, 0) AS total_items,
    
    -- Extras (envío + mano de obra) (calculado por separado para evitar duplicación)
    COALESCE(extras_totals.total_extras, 0) AS total_extras,
    
    -- Descuentos (restan) (calculado por separado para evitar duplicación)
    COALESCE(extras_totals.total_descuentos, 0) AS total_descuentos,
    
    -- Total a pagar (items + extras - descuentos)
    COALESCE(items_totals.total_items, 0) +
    COALESCE(extras_totals.total_extras, 0) -
    COALESCE(extras_totals.total_descuentos, 0) AS total_a_pagar,
    
    -- Pagos realizados (calculado por separado para evitar duplicación)
    COALESCE(payments_totals.total_pagado, 0) AS total_pagado,
    
    -- Saldo restante
    COALESCE(items_totals.total_items, 0) +
    COALESCE(extras_totals.total_extras, 0) -
    COALESCE(extras_totals.total_descuentos, 0) -
    COALESCE(payments_totals.total_pagado, 0) AS saldo_restante
    
FROM transaction t
LEFT JOIN person p ON t.person_id = p.person_id
LEFT JOIN transport_companies tc ON t.transport_id = tc.company_id

-- Subconsulta para calcular totales de items sin duplicación
LEFT JOIN (
    SELECT 
        transaction_id,
        SUM(quantity * price) AS total_items
    FROM items
    GROUP BY transaction_id
) items_totals ON t.transaction_id = items_totals.transaction_id

-- Subconsulta para calcular totales de extras sin duplicación
LEFT JOIN (
    SELECT 
        transaction_id,
        SUM(CASE 
            WHEN type IN ('Envio', 'Mano de obra', 'Otro') THEN price
            ELSE 0 END) AS total_extras,
        SUM(CASE 
            WHEN type = 'Descuento' THEN price
            ELSE 0 END) AS total_descuentos
    FROM extras
    GROUP BY transaction_id
) extras_totals ON t.transaction_id = extras_totals.transaction_id

-- Subconsulta para calcular totales de pagos sin duplicación
LEFT JOIN (
    SELECT 
        transaction_id,
        SUM(amount) AS total_pagado
    FROM payments
    GROUP BY transaction_id
) payments_totals ON t.transaction_id = payments_totals.transaction_id

WHERE t.is_sale = TRUE;
