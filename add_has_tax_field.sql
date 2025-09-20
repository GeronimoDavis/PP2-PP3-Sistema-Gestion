-- =============================================
-- AGREGAR CAMPO has_tax A LA TABLA TRANSACTION
-- =============================================
-- Ejecutar este script en phpMyAdmin para agregar el campo has_tax

-- Agregar el campo has_tax a la tabla transaction
ALTER TABLE transaction ADD COLUMN has_tax BOOLEAN DEFAULT TRUE;

-- Actualizar las transacciones existentes basándose en el tax_type
-- Las transacciones con tax_type "Exento" tendrán has_tax = FALSE
-- Las demás tendrán has_tax = TRUE
UPDATE transaction 
SET has_tax = CASE 
    WHEN tax_type = 'Exento' THEN FALSE
    ELSE TRUE
END;

