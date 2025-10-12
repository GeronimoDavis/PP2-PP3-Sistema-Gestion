-- =============================================
-- SCRIPT PARA AGREGAR CAMPO stock_minimum
-- Permite configurar límite personalizado para stock bajo
-- =============================================

USE stockRepuestos;

-- Agregar el campo stock_minimum a la tabla product
ALTER TABLE product 
ADD COLUMN stock_minimum INT DEFAULT 5 COMMENT 'Límite mínimo de stock para considerar stock bajo';

-- Actualizar productos existentes con un valor por defecto de 5
UPDATE product 
SET stock_minimum = 5 
WHERE stock_minimum IS NULL;

-- Verificar que el campo se agregó correctamente
SELECT 
    product_id,
    name,
    code,
    stock,
    stock_minimum,
    CASE 
        WHEN stock = 0 THEN 'Sin Stock'
        WHEN stock <= stock_minimum THEN 'Stock Bajo'
        ELSE 'En Stock'
    END AS stock_status
FROM product 
LIMIT 10;
