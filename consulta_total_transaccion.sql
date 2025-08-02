-- =============================================
-- CONSULTA: PRECIO TOTAL DE ITEMS Y EXTRAS POR TRANSACCIÓN
-- =============================================
--
-- VERSIÓN ACTUALIZADA: Sin campo 'total' redundante en la tabla transaction
-- Ahora el total se calcula dinámicamente desde items + extras
-- Se incluye información de pagos y estado de pago
--

-- Consulta para obtener el total de items y extras de TODAS las transacciones
SELECT 
    t.transaction_id,
    t.date,
    t.is_sale,
    CASE 
        WHEN t.is_sale = 1 THEN 'Venta'
        ELSE 'Compra'
    END AS tipo_transaccion,
    p.company_name AS cliente_proveedor,
    
    -- Total de items (cantidad * precio)
    COALESCE(SUM(i.quantity * i.price), 0) AS total_items,
    
    -- Total de extras
    COALESCE(SUM(e.price), 0) AS total_extras,
    
    -- Total calculado (items + extras) - ESTA ES LA FUENTE DE VERDAD
    COALESCE(SUM(i.quantity * i.price), 0) + COALESCE(SUM(e.price), 0) AS total_transaccion,
    
    -- Total pagado
    COALESCE(SUM(pa.amount), 0) AS total_pagado,
    
    -- Saldo pendiente
    COALESCE(SUM(i.quantity * i.price), 0) + COALESCE(SUM(e.price), 0) - COALESCE(SUM(pa.amount), 0) AS saldo_pendiente,
    
    -- Estado del pago
    CASE 
        WHEN COALESCE(SUM(pa.amount), 0) = 0 THEN 'Sin pagos'
        WHEN COALESCE(SUM(pa.amount), 0) < (COALESCE(SUM(i.quantity * i.price), 0) + COALESCE(SUM(e.price), 0)) THEN 'Pago parcial'
        WHEN COALESCE(SUM(pa.amount), 0) = (COALESCE(SUM(i.quantity * i.price), 0) + COALESCE(SUM(e.price), 0)) THEN 'Pagado completo'
        WHEN COALESCE(SUM(pa.amount), 0) > (COALESCE(SUM(i.quantity * i.price), 0) + COALESCE(SUM(e.price), 0)) THEN 'Sobrepago'
    END AS estado_pago

FROM transaction t
LEFT JOIN items i ON t.transaction_id = i.transaction_id
LEFT JOIN extras e ON t.transaction_id = e.transaction_id
LEFT JOIN payments pa ON t.transaction_id = pa.transaction_id
LEFT JOIN person p ON t.person_id = p.person_id

GROUP BY t.transaction_id, t.date, t.is_sale, p.company_name
ORDER BY t.date DESC, t.transaction_id;

-- =============================================
-- CONSULTA ESPECÍFICA PARA UNA TRANSACCIÓN
-- =============================================

-- Para obtener el detalle de una transacción específica (cambiar el ID)
SELECT 
    t.transaction_id,
    t.date,
    CASE 
        WHEN t.is_sale = 1 THEN 'Venta'
        ELSE 'Compra'
    END AS tipo_transaccion,
    p.company_name AS cliente_proveedor,
    
    -- Detalle de items
    'ITEMS' AS seccion,
    pr.name AS descripcion,
    i.quantity AS cantidad,
    i.price AS precio_unitario,
    (i.quantity * i.price) AS subtotal
    
FROM transaction t
LEFT JOIN items i ON t.transaction_id = i.transaction_id
LEFT JOIN product pr ON i.product_id = pr.product_id
LEFT JOIN person p ON t.person_id = p.person_id

WHERE t.transaction_id = 1 -- CAMBIAR ESTE ID

UNION ALL

-- Detalle de extras
SELECT 
    t.transaction_id,
    t.date,
    CASE 
        WHEN t.is_sale = 1 THEN 'Venta'
        ELSE 'Compra'
    END AS tipo_transaccion,
    p.company_name AS cliente_proveedor,
    
    -- Detalle de extras
    'EXTRAS' AS seccion,
    CONCAT(e.type, ' - ', e.note) AS descripcion,
    1 AS cantidad,
    e.price AS precio_unitario,
    e.price AS subtotal
    
FROM transaction t
LEFT JOIN extras e ON t.transaction_id = e.transaction_id
LEFT JOIN person p ON t.person_id = p.person_id

WHERE t.transaction_id = 1 -- CAMBIAR ESTE ID

ORDER BY seccion, descripcion;

-- =============================================
-- CONSULTA RESUMEN PARA UNA TRANSACCIÓN ESPECÍFICA
-- =============================================

-- Resumen de totales para una transacción específica
SELECT 
    t.transaction_id,
    t.date,
    CASE 
        WHEN t.is_sale = 1 THEN 'Venta'
        ELSE 'Compra'
    END AS tipo_transaccion,
    p.company_name AS cliente_proveedor,
    
    -- Conteo de items y extras
    COUNT(DISTINCT i.item_id) AS cantidad_items,
    COUNT(DISTINCT e.extra_id) AS cantidad_extras,
    
    -- Totales
    COALESCE(SUM(i.quantity * i.price), 0) AS total_items,
    COALESCE(SUM(e.price), 0) AS total_extras,
    COALESCE(SUM(i.quantity * i.price), 0) + COALESCE(SUM(e.price), 0) AS total_transaccion,
    
    -- Información de pagos
    COALESCE(SUM(pa.amount), 0) AS total_pagado,
    COALESCE(SUM(i.quantity * i.price), 0) + COALESCE(SUM(e.price), 0) - COALESCE(SUM(pa.amount), 0) AS saldo_pendiente,
    
    -- Estado del pago
    CASE 
        WHEN COALESCE(SUM(pa.amount), 0) = 0 THEN 'Sin pagos'
        WHEN COALESCE(SUM(pa.amount), 0) < (COALESCE(SUM(i.quantity * i.price), 0) + COALESCE(SUM(e.price), 0)) THEN 'Pago parcial'
        WHEN COALESCE(SUM(pa.amount), 0) = (COALESCE(SUM(i.quantity * i.price), 0) + COALESCE(SUM(e.price), 0)) THEN 'Pagado completo'
        WHEN COALESCE(SUM(pa.amount), 0) > (COALESCE(SUM(i.quantity * i.price), 0) + COALESCE(SUM(e.price), 0)) THEN 'Sobrepago'
    END AS estado_pago

FROM transaction t
LEFT JOIN items i ON t.transaction_id = i.transaction_id
LEFT JOIN extras e ON t.transaction_id = e.transaction_id
LEFT JOIN payments pa ON t.transaction_id = pa.transaction_id
LEFT JOIN person p ON t.person_id = p.person_id

WHERE t.transaction_id = 1 -- CAMBIAR ESTE ID

GROUP BY t.transaction_id, t.date, t.is_sale, p.company_name;

-- =============================================
-- CONSULTA PARA VALIDAR ESTADO DE PAGOS
-- =============================================

-- Verificar transacciones con pagos pendientes o problemas de pago
SELECT 
    t.transaction_id,
    t.date,
    CASE 
        WHEN t.is_sale = 1 THEN 'Venta'
        ELSE 'Compra'
    END AS tipo_transaccion,
    p.company_name AS cliente_proveedor,
    
    COALESCE(SUM(i.quantity * i.price), 0) AS total_items,
    COALESCE(SUM(e.price), 0) AS total_extras,
    COALESCE(SUM(i.quantity * i.price), 0) + COALESCE(SUM(e.price), 0) AS total_transaccion,
    COALESCE(SUM(pa.amount), 0) AS total_pagado,
    COALESCE(SUM(i.quantity * i.price), 0) + COALESCE(SUM(e.price), 0) - COALESCE(SUM(pa.amount), 0) AS saldo_pendiente,
    
    -- Estado del pago
    CASE 
        WHEN COALESCE(SUM(pa.amount), 0) = 0 THEN 'SIN PAGOS'
        WHEN COALESCE(SUM(pa.amount), 0) < (COALESCE(SUM(i.quantity * i.price), 0) + COALESCE(SUM(e.price), 0)) THEN 'PAGO PARCIAL'
        WHEN COALESCE(SUM(pa.amount), 0) = (COALESCE(SUM(i.quantity * i.price), 0) + COALESCE(SUM(e.price), 0)) THEN 'PAGADO COMPLETO'
        WHEN COALESCE(SUM(pa.amount), 0) > (COALESCE(SUM(i.quantity * i.price), 0) + COALESCE(SUM(e.price), 0)) THEN 'SOBREPAGO'
    END AS estado_pago

FROM transaction t
LEFT JOIN items i ON t.transaction_id = i.transaction_id
LEFT JOIN extras e ON t.transaction_id = e.transaction_id
LEFT JOIN payments pa ON t.transaction_id = pa.transaction_id
LEFT JOIN person p ON t.person_id = p.person_id

GROUP BY t.transaction_id, t.date, t.is_sale, p.company_name
HAVING COALESCE(SUM(pa.amount), 0) != (COALESCE(SUM(i.quantity * i.price), 0) + COALESCE(SUM(e.price), 0))
ORDER BY ABS(saldo_pendiente) DESC;

-- =============================================
-- EJEMPLO DE USO PARA UNA TRANSACCIÓN ESPECÍFICA
-- =============================================

-- Ejemplo: Obtener totales de la transacción ID 21 (primera venta)
SELECT 
    'RESUMEN DE TRANSACCIÓN' AS titulo,
    t.transaction_id,
    t.date,
    CASE 
        WHEN t.is_sale = 1 THEN 'Venta'
        ELSE 'Compra'
    END AS tipo,
    p.company_name AS cliente,
    
    -- Cálculo detallado
    COALESCE(SUM(i.quantity * i.price), 0) AS total_items,
    COALESCE(SUM(e.price), 0) AS total_extras,
    COALESCE(SUM(i.quantity * i.price), 0) + COALESCE(SUM(e.price), 0) AS total_transaccion,
    
    -- Información de pagos
    COALESCE(SUM(pa.amount), 0) AS total_pagado,
    COALESCE(SUM(i.quantity * i.price), 0) + COALESCE(SUM(e.price), 0) - COALESCE(SUM(pa.amount), 0) AS saldo_pendiente,
    
    -- Estado del pago
    CASE 
        WHEN COALESCE(SUM(pa.amount), 0) = 0 THEN 'Sin pagos'
        WHEN COALESCE(SUM(pa.amount), 0) < (COALESCE(SUM(i.quantity * i.price), 0) + COALESCE(SUM(e.price), 0)) THEN 'Pago parcial'
        WHEN COALESCE(SUM(pa.amount), 0) = (COALESCE(SUM(i.quantity * i.price), 0) + COALESCE(SUM(e.price), 0)) THEN 'Pagado completo'
        WHEN COALESCE(SUM(pa.amount), 0) > (COALESCE(SUM(i.quantity * i.price), 0) + COALESCE(SUM(e.price), 0)) THEN 'Sobrepago'
    END AS estado_pago

FROM transaction t
LEFT JOIN items i ON t.transaction_id = i.transaction_id
LEFT JOIN extras e ON t.transaction_id = e.transaction_id
LEFT JOIN payments pa ON t.transaction_id = pa.transaction_id
LEFT JOIN person p ON t.person_id = p.person_id

WHERE t.transaction_id = 21
GROUP BY t.transaction_id, t.date, t.is_sale, p.company_name;

-- =============================================
-- CONSULTA RÁPIDA: OBTENER SOLO EL TOTAL DE UNA TRANSACCIÓN
-- =============================================

-- Consulta simplificada para obtener únicamente el total de una transacción
SELECT 
    t.transaction_id,
    COALESCE(SUM(i.quantity * i.price), 0) + COALESCE(SUM(e.price), 0) AS total_transaccion
FROM transaction t
LEFT JOIN items i ON t.transaction_id = i.transaction_id
LEFT JOIN extras e ON t.transaction_id = e.transaction_id
WHERE t.transaction_id = 1  -- CAMBIAR ESTE ID
GROUP BY t.transaction_id;

-- =============================================
-- CONSULTA: TRANSACCIONES CON PAGOS PENDIENTES
-- =============================================

-- Obtener solo las transacciones que tienen saldo pendiente
SELECT 
    t.transaction_id,
    t.date,
    CASE 
        WHEN t.is_sale = 1 THEN 'Venta'
        ELSE 'Compra'
    END AS tipo_transaccion,
    p.company_name AS cliente_proveedor,
    
    COALESCE(SUM(i.quantity * i.price), 0) + COALESCE(SUM(e.price), 0) AS total_transaccion,
    COALESCE(SUM(pa.amount), 0) AS total_pagado,
    COALESCE(SUM(i.quantity * i.price), 0) + COALESCE(SUM(e.price), 0) - COALESCE(SUM(pa.amount), 0) AS saldo_pendiente

FROM transaction t
LEFT JOIN items i ON t.transaction_id = i.transaction_id
LEFT JOIN extras e ON t.transaction_id = e.transaction_id
LEFT JOIN payments pa ON t.transaction_id = pa.transaction_id
LEFT JOIN person p ON t.person_id = p.person_id

GROUP BY t.transaction_id, t.date, t.is_sale, p.company_name
HAVING COALESCE(SUM(i.quantity * i.price), 0) + COALESCE(SUM(e.price), 0) - COALESCE(SUM(pa.amount), 0) > 0
ORDER BY saldo_pendiente DESC; 