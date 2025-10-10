-- =============================================
-- SCRIPT COMPLETO PARA CREAR BASE DE DATOS
-- Incluye todas las modificaciones para presupuestos
-- =============================================

CREATE DATABASE IF NOT EXISTS stockRepuestos;

USE stockRepuestos;

-- Tabla de personas
CREATE TABLE IF NOT EXISTS person (
	person_id INT AUTO_INCREMENT NOT NULL UNIQUE, 
	tax_id VARCHAR(11) NOT NULL, 
	company_name VARCHAR(50) NOT NULL,
	name VARCHAR(50),
	email VARCHAR(255) NOT NULL,
	phone VARCHAR(15) NOT NULL,
	notes TINYTEXT,
	address VARCHAR(50) NOT NULL,
	provider BOOL NOT NULL,
	tax_type ENUM("R.I", "Exento", "R.N.I", "Monotributo", "Consumidor Final"),
	active BOOLEAN DEFAULT TRUE,
	PRIMARY KEY(person_id)
);

-- Tabla de usuarios
CREATE TABLE users (
	user_id INT PRIMARY KEY AUTO_INCREMENT UNIQUE,
	username VARCHAR(50) NOT NULL UNIQUE,
	name VARCHAR(50) NOT NULL UNIQUE,
	password VARCHAR(255) NOT NULL,
	role ENUM("Administrador", "Empleado") NOT NULL,
	active BOOLEAN DEFAULT TRUE
);

-- Tabla de categorías
CREATE TABLE IF NOT EXISTS category(
	category_id INT PRIMARY KEY AUTO_INCREMENT UNIQUE,
	name VARCHAR(30),
	active BOOLEAN DEFAULT TRUE
);

-- Tabla de productos
CREATE TABLE IF NOT EXISTS product(
	product_id INT PRIMARY KEY AUTO_INCREMENT UNIQUE,
	name VARCHAR(50),
	code VARCHAR(20) NOT NULL UNIQUE,
	stock MEDIUMINT,
	sell_price FLOAT,
	purchase_price FLOAT,
	category_id INT,
	active BOOLEAN DEFAULT TRUE,
	FOREIGN KEY(category_id) REFERENCES category(category_id)
);

-- Tabla de empresas de transporte
CREATE TABLE transport_companies(
	company_id INT PRIMARY KEY AUTO_INCREMENT UNIQUE,
	name VARCHAR(30),
	url VARCHAR(40),
	active BOOLEAN DEFAULT TRUE
);

-- Tabla de transacciones (CON CAMPO is_budget INCLUIDO)
CREATE TABLE transaction(
	transaction_id INT PRIMARY KEY AUTO_INCREMENT UNIQUE,
	date DATE,
	is_sale BOOL,
	person_id INT,
	transport_id INT NULL,	 
	tracking_number VARCHAR(20),
	tax_type ENUM("R.I", "Exento", "R.N.I", "Monotributo", "Consumidor Final"),
	has_tax BOOLEAN DEFAULT TRUE,
	is_budget BOOLEAN DEFAULT FALSE,
	FOREIGN KEY(person_id) REFERENCES person(person_id),
	FOREIGN KEY(transport_id) REFERENCES transport_companies(company_id)	
);

-- Tabla de items
CREATE TABLE items(
	item_id INT PRIMARY KEY AUTO_INCREMENT,
	transaction_id INT,
	product_id INT,
	quantity MEDIUMINT,
	price FLOAT,
	FOREIGN KEY(transaction_id) REFERENCES transaction(transaction_id),
	FOREIGN KEY(product_id) REFERENCES product(product_id)
);

-- Tabla de extras
CREATE TABLE extras(
	extra_id INT PRIMARY KEY AUTO_INCREMENT,
	transaction_id INT NOT NULL,
	price FLOAT,
	note VARCHAR(50),
	type ENUM("Mano de obra", "Envio", "Descuento"),
	FOREIGN KEY(transaction_id) REFERENCES transaction(transaction_id)
);

-- Tabla de pagos
CREATE TABLE payments(
	payment_id INT PRIMARY KEY AUTO_INCREMENT,
	transaction_id INT,
	amount MEDIUMINT,
	note VARCHAR(255) DEFAULT '',
	type ENUM('Efectivo', 'Transferencia', 'Tarjeta', 'Cheque', 'Credito30', 'Credito60', 'Credito90', 'Otro'),
	date DATETIME,
	FOREIGN KEY(transaction_id) REFERENCES transaction(transaction_id)
);

-- Vista de ventas detalladas (CON CAMPO is_budget INCLUIDO)
CREATE OR REPLACE VIEW view_ventas_detalladas AS
SELECT
    t.transaction_id,
    t.date,
    t.tracking_number,
    t.tax_type,
    t.has_tax,
    t.is_budget,
    
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
    
    -- Subtotal (items + extras - descuentos) - SIN IVA
    COALESCE(items_totals.total_items, 0) +
    COALESCE(extras_totals.total_extras, 0) -
    COALESCE(extras_totals.total_descuentos, 0) AS subtotal,
    
    -- IVA (21% del subtotal si has_tax = TRUE)
    CASE 
        WHEN t.has_tax = TRUE THEN 
            (COALESCE(items_totals.total_items, 0) + 
             COALESCE(extras_totals.total_extras, 0) - 
             COALESCE(extras_totals.total_descuentos, 0)) * 0.21
        ELSE 0 
    END AS iva,
    
    -- Total a pagar (subtotal + IVA)
    CASE 
        WHEN t.has_tax = TRUE THEN 
            (COALESCE(items_totals.total_items, 0) + 
             COALESCE(extras_totals.total_extras, 0) - 
             COALESCE(extras_totals.total_descuentos, 0)) * 1.21
        ELSE 
            COALESCE(items_totals.total_items, 0) + 
            COALESCE(extras_totals.total_extras, 0) - 
            COALESCE(extras_totals.total_descuentos, 0)
    END AS total_a_pagar,
    
    -- Pagos realizados (calculado por separado para evitar duplicación)
    COALESCE(payments_totals.total_pagado, 0) AS total_pagado,
    
    -- Saldo restante (total_a_pagar - total_pagado)
    CASE 
        WHEN t.has_tax = TRUE THEN 
            (COALESCE(items_totals.total_items, 0) + 
             COALESCE(extras_totals.total_extras, 0) - 
             COALESCE(extras_totals.total_descuentos, 0)) * 1.21 - 
            COALESCE(payments_totals.total_pagado, 0)
        ELSE 
            COALESCE(items_totals.total_items, 0) + 
            COALESCE(extras_totals.total_extras, 0) - 
            COALESCE(extras_totals.total_descuentos, 0) - 
            COALESCE(payments_totals.total_pagado, 0)
    END AS saldo_restante
    
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

WHERE t.is_sale = TRUE
ORDER BY t.date DESC;

-- Vista de compras detalladas (CON CAMPO is_budget INCLUIDO)
CREATE OR REPLACE VIEW view_compras_detalladas AS
SELECT
    t.transaction_id,
    t.date,
    t.tracking_number,
    t.tax_type,
    t.has_tax,
    t.is_budget,
    
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
    
    -- Subtotal (items + extras - descuentos) - SIN IVA
    COALESCE(items_totals.total_items, 0) +
    COALESCE(extras_totals.total_extras, 0) -
    COALESCE(extras_totals.total_descuentos, 0) AS subtotal,
    
    -- IVA (21% del subtotal si has_tax = TRUE)
    CASE 
        WHEN t.has_tax = TRUE THEN 
            (COALESCE(items_totals.total_items, 0) + 
             COALESCE(extras_totals.total_extras, 0) - 
             COALESCE(extras_totals.total_descuentos, 0)) * 0.21
        ELSE 0 
    END AS iva,

    -- Total a pagar (subtotal + IVA)
    CASE 
        WHEN t.has_tax = TRUE THEN 
            (COALESCE(items_totals.total_items, 0) + 
             COALESCE(extras_totals.total_extras, 0) - 
             COALESCE(extras_totals.total_descuentos, 0)) * 1.21
        ELSE 
            COALESCE(items_totals.total_items, 0) + 
            COALESCE(extras_totals.total_extras, 0) - 
            COALESCE(extras_totals.total_descuentos, 0)
    END AS total_a_pagar,
    
    -- Pagos realizados (calculado por separado para evitar duplicación)
    COALESCE(payments_totals.total_pagado, 0) AS total_pagado,
    
    -- Saldo restante (total_a_pagar - total_pagado)
     CASE 
        WHEN t.has_tax = TRUE THEN 
            (COALESCE(items_totals.total_items, 0) + 
             COALESCE(extras_totals.total_extras, 0) - 
             COALESCE(extras_totals.total_descuentos, 0)) * 1.21 - 
            COALESCE(payments_totals.total_pagado, 0)
        ELSE
            COALESCE(items_totals.total_items, 0) + 
            COALESCE(extras_totals.total_extras, 0) - 
            COALESCE(extras_totals.total_descuentos, 0) - 
            COALESCE(payments_totals.total_pagado, 0)
    END AS saldo_restante
    
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

WHERE t.is_sale = FALSE
ORDER BY t.date DESC;
