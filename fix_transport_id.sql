-- Script para permitir que transport_id sea NULL en la tabla transaction
USE stockRepuestos;

-- Modificar la columna transport_id para permitir NULL
ALTER TABLE transaction MODIFY COLUMN transport_id int NULL;

-- Verificar que el cambio se aplicó correctamente
DESCRIBE transaction; 