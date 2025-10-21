-- =============================================
-- SCRIPT PARA ELIMINAR CAMPO PROVIDER
-- Sistema de Gestión de Stock de Repuestos
-- =============================================

USE stockRepuestos;

-- Eliminar el campo provider de la tabla person
-- Ya no necesitamos distinguir entre clientes y proveedores
-- Todas las personas pueden tener tanto ventas como compras
ALTER TABLE person DROP COLUMN provider;

-- Verificar que el campo se eliminó correctamente
DESCRIBE person;

-- Verificar que las vistas siguen funcionando correctamente
-- (Las vistas usan is_sale, no provider, así que no necesitan cambios)
SELECT 'Vista de ventas:' as verificacion;
SHOW CREATE VIEW view_ventas_detalladas;

SELECT 'Vista de compras:' as verificacion;
SHOW CREATE VIEW view_compras_detalladas;

-- =============================================
-- FIN DEL SCRIPT
-- =============================================
