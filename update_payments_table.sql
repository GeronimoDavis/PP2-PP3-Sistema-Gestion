-- Actualizar la tabla payments para agregar la columna note y actualizar el enum
ALTER TABLE payments 
ADD COLUMN note VARCHAR(255) DEFAULT '';

-- Actualizar el enum para incluir todos los tipos de pago
ALTER TABLE payments 
MODIFY COLUMN type ENUM(
    'Efectivo',
    'Transferencia', 
    'Tarjeta',
    'Cheque',
    'Credito30',
    'Credito60', 
    'Credito90',
    'Otro'
);
