-- Actualizar las transacciones existentes basándose en el tax_type
-- Las transacciones con tax_type "Exento" tendrán has_tax = FALSE
-- Las demás tendrán has_tax = TRUE
UPDATE transaction 
SET has_tax = CASE 
    WHEN tax_type = 'Exento' THEN FALSE
    ELSE TRUE
END;

