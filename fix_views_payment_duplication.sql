-- =============================================
-- SCRIPT PARA CORREGIR DUPLICACIÓN DE PAGOS EN VISTAS
-- =============================================
--
-- PROBLEMA IDENTIFICADO:
-- Las vistas view_ventas_detalladas y view_compras_detalladas tenían un problema
-- donde los LEFT JOINs con la tabla payments causaban que los totales de items
-- y extras se multiplicaran por el número de pagos de cada transacción.
--
-- SOLUCIÓN:
-- Usar subconsultas para calcular los totales por separado, evitando la duplicación
-- causada por los JOINs múltiples.
--
-- FECHA: $(date)
-- =============================================

-- Actualizar vista de ventas detalladas
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

-- Actualizar vista de compras detalladas
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

WHERE t.is_sale = FALSE;

-- =============================================
-- VERIFICACIÓN DE LA CORRECCIÓN
-- =============================================

-- Consulta para verificar que los totales ahora son correctos
-- Esta consulta debe mostrar que los totales ya no se duplican
SELECT 
    'VERIFICACIÓN DE CORRECCIÓN' AS titulo,
    transaction_id,
    total_items,
    total_extras,
    total_descuentos,
    total_a_pagar,
    total_pagado,
    saldo_restante,
    CASE 
        WHEN total_pagado = 0 THEN 'Sin pagos'
        WHEN total_pagado < total_a_pagar THEN 'Pago parcial'
        WHEN total_pagado = total_a_pagar THEN 'Pagado completo'
        WHEN total_pagado > total_a_pagar THEN 'Sobrepago'
    END AS estado_pago
FROM view_ventas_detalladas
ORDER BY transaction_id DESC
LIMIT 10;

-- Mensaje de confirmación
SELECT 'Vistas actualizadas correctamente. El problema de duplicación de pagos ha sido resuelto.' AS mensaje;
