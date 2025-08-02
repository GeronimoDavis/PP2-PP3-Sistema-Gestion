-- =============================================
-- SEEDER PARA BASE DE DATOS stockRepuestos
-- =============================================
--
-- VERSIÓN ACTUALIZADA: Sin campo 'total' en la tabla transaction
-- El total se calcula dinámicamente desde items + extras
--

USE stockRepuestos;

-- Deshabilitar verificación de claves foráneas temporalmente
SET FOREIGN_KEY_CHECKS = 0;

-- =============================================
-- INSERTAR USUARIOS
-- =============================================
INSERT INTO users (username, password, role) VALUES
('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrador'),
('contador1', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Contador'),
('admin2', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrador'),
('contador2', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Contador');

-- =============================================
-- INSERTAR CATEGORÍAS
-- =============================================
INSERT INTO category (name) VALUES
('Motor'),
('Transmisión'),
('Frenos'),
('Suspensión'),
('Dirección'),
('Eléctrico'),
('Carrocería'),
('Filtros'),
('Lubricantes'),
('Neumáticos'),
('Iluminación'),
('Refrigeración'),
('Escape'),
('Combustible'),
('Herramientas');

-- =============================================
-- INSERTAR PERSONAS (CLIENTES Y PROVEEDORES)
-- =============================================
INSERT INTO person (tax_id, company_name, name, email, phone, notes, address, provider, tax_type) VALUES
-- PROVEEDORES
('20123456789', 'Repuestos Automotrices SA', 'Juan Pérez', 'ventas@repautosa.com', '011-4567-8901', 'Proveedor principal', 'Av. Córdoba 1234', true, 'R.I'),
('20234567890', 'Distribuidora AutoParts', 'María González', 'pedidos@autoparts.com', '011-5678-9012', 'Buen precio en filtros', 'Av. Rivadavia 5678', true, 'R.I'),
('20345678901', 'Motores y Transmisiones', 'Carlos Rodríguez', 'info@motorestrans.com', '011-6789-0123', 'Especialista en motor', 'Av. San Martín 9012', true, 'R.I'),
('20456789012', 'Frenos Premium SRL', 'Ana Martínez', 'contacto@frenospremium.com', '011-7890-1234', 'Frenos importados', 'Av. Belgrano 3456', true, 'R.I'),
('20567890123', 'Eléctricos del Sur', 'Pedro López', 'ventas@electricsur.com', '011-8901-2345', 'Componentes eléctricos', 'Av. Independencia 7890', true, 'R.I'),
('23678901234', 'Lubricantes Total', 'Laura Fernández', 'pedidos@lubricantestotal.com', '011-9012-3456', 'Aceites y lubricantes', 'Av. Corrientes 2345', true, 'Monotributo'),
('20789012345', 'Neumáticos Express', 'Roberto Silva', 'info@neumaticosexpress.com', '011-0123-4567', 'Neumáticos de todas las marcas', 'Av. Callao 6789', true, 'R.I'),
('23890123456', 'Suspensión y Dirección', 'Patricia Gómez', 'ventas@suspdireccion.com', '011-1234-5678', 'Amortiguadores y dirección', 'Av. Santa Fe 1234', true, 'Monotributo'),

-- CLIENTES
('20987654321', 'Taller Mecánico Central', 'Miguel Herrera', 'taller@central.com', '011-2345-6789', 'Taller de confianza', 'Av. Mitre 5678', false, 'R.I'),
('23876543210', 'Autoservicio Rápido', 'Claudia Morales', 'autoservicio@rapido.com', '011-3456-7890', 'Service express', 'Av. Pueyrredón 9012', false, 'Monotributo'),
('20765432109', 'Mecánica Profesional', 'Daniel Castro', 'mecanica@profesional.com', '011-4567-8901', 'Reparaciones generales', 'Av. Brasil 3456', false, 'R.I'),
('23654321098', 'Taller Norte', 'Silvia Romero', 'contacto@tallernorte.com', '011-5678-9012', 'Especialista en transmisiones', 'Av. Cabildo 7890', false, 'Monotributo'),
('20543210987', 'Repuestos y Service', 'Fernando Díaz', 'repuestos@service.com', '011-6789-0123', 'Taller completo', 'Av. Libertador 1234', false, 'R.I'),
('23432109876', 'Mecánica del Oeste', 'Graciela Vega', 'mecanica@oeste.com', '011-7890-1234', 'Atención personalizada', 'Av. Rivadavia 5678', false, 'Monotributo'),
('20321098765', 'Autopartes San Martín', 'Julio Mendoza', 'autopartes@sanmartin.com', '011-8901-2345', 'Venta de repuestos', 'Av. San Martín 9012', false, 'R.I'),
('23210987654', 'Taller del Sur', 'Mónica Blanco', 'taller@sur.com', '011-9012-3456', 'Reparaciones especializadas', 'Av. Avellaneda 3456', false, 'Monotributo'),
('20109876543', 'Mecánica Integral', 'Ricardo Peña', 'mecanica@integral.com', '011-0123-4567', 'Todos los servicios', 'Av. Córdoba 7890', false, 'R.I'),
('23098765432', 'Service Express', 'Alejandra Ruiz', 'service@express.com', '011-1234-5678', 'Atención rápida', 'Av. Callao 1234', false, 'Monotributo'),
('20987654320', 'Taller Central', 'Andrés Giménez', 'taller@central2.com', '011-2345-6789', 'Especialista en frenos', 'Av. Corrientes 5678', false, 'R.I'),
('23876543219', 'Autopartes Premium', 'Lucía Torres', 'autopartes@premium.com', '011-3456-7890', 'Repuestos de calidad', 'Av. Santa Fe 9012', false, 'Monotributo'),
('20765432118', 'Mecánica Moderna', 'Gustavo Acosta', 'mecanica@moderna.com', '011-4567-8901', 'Tecnología avanzada', 'Av. Belgrano 3456', false, 'R.I'),
('23654321017', 'Taller Especializado', 'Beatriz Luna', 'taller@especializado.com', '011-5678-9012', 'Diagnóstico computarizado', 'Av. Independencia 7890', false, 'Monotributo'),
('20543210916', 'Repuestos González', 'Eduardo González', 'repuestos@gonzalez.com', '011-6789-0123', 'Amplio stock', 'Av. Mitre 1234', false, 'R.I');

-- =============================================
-- INSERTAR EMPRESAS DE TRANSPORTE
-- =============================================
INSERT INTO transport_companies (name, url) VALUES
('Correo Argentino', 'https://www.correoargentino.com.ar'),
('OCA', 'https://www.oca.com.ar'),
('Andreani', 'https://www.andreani.com'),
('Mercado Envíos', 'https://www.mercadolibre.com.ar'),
('Cruz del Sur Cargas', 'https://www.cruzdelsur.com.ar'),
('Expreso Tigre', 'https://www.expresotigre.com.ar'),
('Integral Cargo', 'https://www.integralcargo.com.ar'),
('Transporte Local', 'https://www.transportelocal.com.ar');

-- =============================================
-- INSERTAR PRODUCTOS
-- =============================================
INSERT INTO product (name, code, stock, purchase_price, category_id) VALUES
-- MOTOR
('Filtro de Aceite Mann W67/2', 'FO-001', 50, 1250.00, 1),
('Filtro de Aceite Bosch 0451103079', 'FO-002', 30, 1180.00, 1),
('Bujía NGK BPR6ES', 'BU-001', 100, 850.00, 1),
('Bujía Bosch FR7DC', 'BU-002', 80, 920.00, 1),
('Junta de Culata Felpro', 'JC-001', 15, 4500.00, 1),
('Pistón STD Mahle', 'PI-001', 20, 3200.00, 1),
('Válvula de Admisión', 'VA-001', 25, 2800.00, 1),
('Válvula de Escape', 'VE-001', 22, 3100.00, 1),
('Empaquetadura de Motor', 'EM-001', 12, 5200.00, 1),
('Cadena de Distribución', 'CD-001', 18, 6800.00, 1),

-- TRANSMISIÓN
('Embrague Sachs 3000 951 301', 'EM-002', 8, 15000.00, 2),
('Disco de Embrague Valeo', 'DE-001', 12, 8500.00, 2),
('Plato de Embrague LUK', 'PE-001', 10, 12000.00, 2),
('Collarin de Embrague', 'CE-001', 15, 3500.00, 2),
('Aceite de Transmisión ATF', 'AT-001', 40, 2200.00, 2),
('Filtro de Transmisión', 'FT-001', 20, 1800.00, 2),
('Junta de Cárter', 'JCA-001', 25, 950.00, 2),
('Solenoide de Transmisión', 'ST-001', 8, 4200.00, 2),

-- FRENOS
('Pastillas de Freno Delanteras Bosch', 'PF-001', 60, 3500.00, 3),
('Pastillas de Freno Traseras Ferodo', 'PF-002', 45, 2800.00, 3),
('Disco de Freno Delantero Brembo', 'DF-001', 20, 8500.00, 3),
('Disco de Freno Trasero', 'DF-002', 18, 6200.00, 3),
('Líquido de Frenos DOT 4', 'LF-001', 35, 1200.00, 3),
('Cilindro de Freno', 'CF-001', 12, 4500.00, 3),
('Bomba de Freno', 'BF-001', 6, 12000.00, 3),
('Sensor ABS', 'SA-001', 10, 5500.00, 3),
('Manguera de Freno', 'MF-001', 30, 850.00, 3),

-- SUSPENSIÓN
('Amortiguador Delantero Monroe', 'AD-001', 25, 8500.00, 4),
('Amortiguador Trasero Bilstein', 'AT-002', 22, 9200.00, 4),
('Resorte Delantero', 'RD-001', 15, 3500.00, 4),
('Resorte Trasero', 'RT-001', 18, 3200.00, 4),
('Cazoleta de Amortiguador', 'CA-001', 40, 1250.00, 4),
('Taco de Motor', 'TM-001', 30, 2800.00, 4),
('Buje de Suspensión', 'BS-001', 50, 450.00, 4),
('Rótula de Suspensión', 'RS-001', 20, 3800.00, 4),

-- DIRECCIÓN
('Bomba de Dirección Hidráulica', 'BD-001', 8, 18000.00, 5),
('Caja de Dirección', 'CD-002', 5, 25000.00, 5),
('Cremallera de Dirección', 'CR-001', 6, 22000.00, 5),
('Aceite de Dirección ATF', 'AD-002', 30, 1800.00, 5),
('Rótula de Dirección', 'RD-002', 25, 2500.00, 5),
('Barra de Dirección', 'BD-002', 12, 4200.00, 5),
('Volante de Dirección', 'VD-001', 8, 8500.00, 5),

-- ELÉCTRICO
('Batería 12V 60Ah Bosch', 'BA-001', 15, 12000.00, 6),
('Alternador Valeo', 'AL-001', 10, 15000.00, 6),
('Motor de Arranque Bosch', 'MA-001', 8, 18000.00, 6),
('Relay 12V 30A', 'RE-001', 100, 350.00, 6),
('Fusible 10A', 'FU-001', 200, 45.00, 6),
('Fusible 20A', 'FU-002', 150, 55.00, 6),
('Cable de Batería', 'CB-001', 20, 850.00, 6),
('Bobina de Encendido', 'BE-001', 12, 3500.00, 6),
('Sensor de Temperatura', 'ST-002', 15, 1800.00, 6),
('Sensor de Presión', 'SP-001', 18, 2200.00, 6),

-- FILTROS
('Filtro de Aire Mann C25860', 'FA-001', 40, 1800.00, 8),
('Filtro de Combustible Bosch', 'FC-001', 35, 1200.00, 8),
('Filtro de Habitáculo', 'FH-001', 25, 950.00, 8),
('Filtro de Aceite Hidráulico', 'FO-003', 20, 1650.00, 8),
('Filtro de Transmisión Automática', 'FT-002', 15, 2200.00, 8),

-- LUBRICANTES
('Aceite Motor 10W-40 Shell', 'AM-001', 60, 1800.00, 9),
('Aceite Motor 5W-30 Mobil', 'AM-002', 50, 2200.00, 9),
('Aceite Motor 20W-50 YPF', 'AM-003', 40, 1600.00, 9),
('Grasa Multipropósito', 'GR-001', 30, 450.00, 9),
('Aceite de Transmisión Manual', 'AT-003', 25, 1500.00, 9),
('Refrigerante Verde', 'RF-001', 35, 850.00, 9),
('Refrigerante Rojo', 'RF-002', 32, 920.00, 9),

-- NEUMÁTICOS
('Neumático 185/65R14 Pirelli', 'NE-001', 20, 15000.00, 10),
('Neumático 195/60R15 Michelin', 'NE-002', 18, 18000.00, 10),
('Neumático 205/55R16 Bridgestone', 'NE-003', 15, 22000.00, 10),
('Cámara de Aire R14', 'CA-002', 30, 850.00, 10),
('Válvula de Neumático', 'VN-001', 100, 120.00, 10),
('Parche para Neumático', 'PN-001', 50, 85.00, 10),

-- ILUMINACIÓN
('Lámpara H1 12V 55W Philips', 'LA-001', 50, 450.00, 11),
('Lámpara H4 12V 60W Osram', 'LA-002', 45, 520.00, 11),
('Lámpara H7 12V 55W', 'LA-003', 40, 480.00, 11),
('Foco LED 12V', 'FL-001', 60, 350.00, 11),
('Intermitente Delantero', 'ID-001', 25, 1200.00, 11),
('Intermitente Trasero', 'IT-001', 22, 950.00, 11),
('Luz de Freno', 'LF-002', 30, 850.00, 11),

-- REFRIGERACIÓN
('Radiador de Agua', 'RA-001', 8, 12000.00, 12),
('Bomba de Agua', 'BA-002', 12, 6500.00, 12),
('Termostato', 'TE-001', 25, 1800.00, 12),
('Manguera Superior de Radiador', 'MS-001', 15, 850.00, 12),
('Manguera Inferior de Radiador', 'MI-001', 18, 920.00, 12),
('Ventilador de Radiador', 'VR-001', 10, 8500.00, 12),
('Sensor de Temperatura', 'ST-003', 20, 1500.00, 12),

-- ESCAPE
('Silenciador Trasero', 'SI-001', 12, 4500.00, 13),
('Silenciador Delantero', 'SI-002', 10, 3800.00, 13),
('Caño de Escape', 'CE-002', 8, 2500.00, 13),
('Junta de Escape', 'JE-001', 40, 250.00, 13),
('Catalizador', 'CA-003', 6, 25000.00, 13),
('Sensor de Oxígeno', 'SO-001', 15, 4500.00, 13),

-- COMBUSTIBLE
('Bomba de Combustible', 'BC-001', 10, 8500.00, 14),
('Filtro de Combustible', 'FC-002', 30, 1200.00, 14),
('Inyector de Combustible', 'IC-001', 20, 3500.00, 14),
('Regulador de Presión', 'RP-001', 12, 2800.00, 14),
('Tapa de Combustible', 'TC-001', 15, 850.00, 14),

-- HERRAMIENTAS
('Llave Inglesa 10mm', 'LI-001', 25, 450.00, 15),
('Llave Inglesa 12mm', 'LI-002', 25, 480.00, 15),
('Destornillador Phillips', 'DP-001', 30, 350.00, 15),
('Destornillador Plano', 'DP-002', 28, 320.00, 15),
('Alicate Universal', 'AU-001', 20, 850.00, 15),
('Martillo 500g', 'MA-002', 15, 1200.00, 15),
('Lima para Metal', 'LM-001', 12, 650.00, 15),
('Prensa para Cojinetes', 'PC-001', 5, 4500.00, 15);

-- =============================================
-- INSERTAR TRANSACCIONES DE COMPRA
-- =============================================
INSERT INTO transaction (date, is_sale, person_id, transport_id, tracking_number, tax_type) VALUES
-- COMPRAS A PROVEEDORES
('2024-01-15', false, 1, 1, 'CP001234567', 'R.I'),
('2024-01-18', false, 2, 2, 'OCA987654321', 'R.I'),
('2024-01-22', false, 3, 3, 'AND456789123', 'R.I'),
('2024-01-25', false, 4, 1, 'CP002345678', 'R.I'),
('2024-01-28', false, 5, 4, 'ML123456789', 'R.I'),
('2024-02-02', false, 6, 2, 'OCA876543210', 'Monotributo'),
('2024-02-05', false, 7, 3, 'AND789012345', 'R.I'),
('2024-02-08', false, 8, 1, 'CP003456789', 'Monotributo'),
('2024-02-12', false, 1, 5, 'CDS567890123', 'R.I'),
('2024-02-15', false, 2, 2, 'OCA765432109', 'R.I'),
('2024-02-20', false, 3, 6, 'ET890123456', 'R.I'),
('2024-02-25', false, 4, 4, 'ML234567890', 'R.I'),
('2024-03-01', false, 5, 3, 'AND012345678', 'R.I'),
('2024-03-05', false, 6, 1, 'CP004567890', 'Monotributo'),
('2024-03-10', false, 7, 7, 'IC345678901', 'R.I'),
('2024-03-15', false, 8, 2, 'OCA654321098', 'Monotributo'),
('2024-03-20', false, 1, 8, 'TL456789012', 'R.I'),
('2024-03-25', false, 2, 5, 'CDS678901234', 'R.I'),
('2024-03-28', false, 3, 3, 'AND123456789', 'R.I'),
('2024-04-02', false, 4, 1, 'CP005678901', 'R.I');

-- =============================================
-- INSERTAR TRANSACCIONES DE VENTA
-- =============================================
INSERT INTO transaction (date, is_sale, person_id, transport_id, tracking_number, tax_type) VALUES
-- VENTAS A CLIENTES
('2024-01-16', true, 9, 1, 'CP101234567', 'R.I'),
('2024-01-19', true, 10, 2, 'OCA187654321', 'Monotributo'),
('2024-01-23', true, 11, 3, 'AND156789123', 'R.I'),
('2024-01-26', true, 12, 4, 'ML1123456789', 'Monotributo'),
('2024-01-29', true, 13, 1, 'CP102345678', 'R.I'),
('2024-02-03', true, 14, 5, 'CDS1567890123', 'Monotributo'),
('2024-02-06', true, 15, 2, 'OCA176543210', 'R.I'),
('2024-02-09', true, 16, 3, 'AND189012345', 'Monotributo'),
('2024-02-13', true, 17, 6, 'ET1890123456', 'R.I'),
('2024-02-16', true, 18, 4, 'ML1234567890', 'Monotributo'),
('2024-02-21', true, 19, 1, 'CP103456789', 'R.I'),
('2024-02-26', true, 20, 7, 'IC1345678901', 'Monotributo'),
('2024-03-02', true, 21, 2, 'OCA154321098', 'R.I'),
('2024-03-06', true, 22, 8, 'TL1456789012', 'Monotributo'),
('2024-03-11', true, 23, 3, 'AND123456789', 'R.I'),
('2024-03-16', true, 9, 5, 'CDS1678901234', 'R.I'),
('2024-03-21', true, 10, 1, 'CP104567890', 'Monotributo'),
('2024-03-26', true, 11, 4, 'ML1345678901', 'R.I'),
('2024-03-29', true, 12, 2, 'OCA143210987', 'Monotributo'),
('2024-04-03', true, 13, 6, 'ET1901234567', 'R.I'),
('2024-04-08', true, 14, 3, 'AND134567890', 'Monotributo'),
('2024-04-12', true, 15, 7, 'IC1456789012', 'R.I'),
('2024-04-16', true, 16, 8, 'TL1567890123', 'Monotributo'),
('2024-04-20', true, 17, 1, 'CP105678901', 'R.I'),
('2024-04-24', true, 18, 5, 'CDS1789012345', 'Monotributo'),
('2024-04-28', true, 19, 2, 'OCA132109876', 'R.I'),
('2024-05-02', true, 20, 4, 'ML1456789012', 'Monotributo'),
('2024-05-06', true, 21, 3, 'AND145678901', 'R.I'),
('2024-05-10', true, 22, 6, 'ET1012345678', 'Monotributo'),
('2024-05-14', true, 23, 1, 'CP106789012', 'R.I');

-- =============================================
-- INSERTAR ITEMS DE TRANSACCIONES
-- =============================================
-- Items para compras (transaction_id 1-20)
INSERT INTO items (transaction_id, product_id, quantity, price) VALUES
-- Compra 1 (transaction_id 1)
(1, 1, 20, 1250.00),
(1, 3, 50, 850.00),
(1, 5, 5, 4500.00),
-- Compra 2 (transaction_id 2)
(2, 21, 30, 3500.00),
(2, 23, 10, 8500.00),
-- Compra 3 (transaction_id 3)
(3, 11, 4, 15000.00),
(3, 13, 6, 12000.00),
-- Compra 4 (transaction_id 4)
(4, 21, 25, 3500.00),
(4, 22, 20, 2800.00),
-- Compra 5 (transaction_id 5)
(5, 41, 8, 18000.00),
(5, 43, 4, 22000.00),
-- Compra 6 (transaction_id 6)
(6, 51, 10, 12000.00),
(6, 53, 5, 18000.00),
-- Compra 7 (transaction_id 7)
(7, 61, 15, 15000.00),
(7, 63, 12, 22000.00),
-- Compra 8 (transaction_id 8)
(8, 31, 12, 8500.00),
(8, 33, 8, 3500.00),
-- Compra 9 (transaction_id 9)
(9, 2, 15, 1180.00),
(9, 4, 40, 920.00),
(9, 6, 8, 3200.00),
-- Compra 10 (transaction_id 10)
(10, 25, 20, 1200.00),
(10, 27, 15, 950.00),
-- Compra 11 (transaction_id 11)
(11, 71, 20, 1800.00),
(11, 73, 15, 950.00),
-- Compra 12 (transaction_id 12)
(12, 24, 15, 8500.00),
(12, 26, 8, 4500.00),
-- Compra 13 (transaction_id 13)
(13, 75, 25, 1800.00),
(13, 77, 20, 1600.00),
-- Compra 14 (transaction_id 14)
(14, 79, 15, 450.00),
(14, 81, 12, 1500.00),
-- Compra 15 (transaction_id 15)
(15, 83, 10, 15000.00),
(15, 85, 8, 22000.00),
-- Compra 16 (transaction_id 16)
(16, 87, 25, 450.00),
(16, 89, 20, 520.00),
-- Compra 17 (transaction_id 17)
(17, 91, 4, 12000.00),
(17, 93, 6, 6500.00),
-- Compra 18 (transaction_id 18)
(18, 99, 6, 4500.00),
(18, 101, 8, 3800.00),
-- Compra 19 (transaction_id 19)
(19, 99, 5, 8500.00),
(19, 100, 10, 3500.00),
-- Compra 20 (transaction_id 20)
(20, 101, 15, 450.00),
(20, 102, 12, 480.00);

-- Items para ventas (transaction_id 21-50)
INSERT INTO items (transaction_id, product_id, quantity, price) VALUES
-- Venta 1 (transaction_id 21)
(21, 1, 5, 2000.00),
(21, 3, 10, 1400.00),
-- Venta 2 (transaction_id 22)
(22, 21, 8, 5500.00),
(22, 23, 2, 13500.00),
-- Venta 3 (transaction_id 23)
(23, 51, 2, 18000.00),
(23, 53, 1, 28000.00),
-- Venta 4 (transaction_id 24)
(24, 61, 3, 24000.00),
(24, 63, 2, 35000.00),
-- Venta 5 (transaction_id 25)
(25, 31, 3, 13500.00),
(25, 33, 2, 5500.00),
-- Venta 6 (transaction_id 26)
(26, 71, 6, 2800.00),
(26, 73, 5, 1500.00),
-- Venta 7 (transaction_id 27)
(27, 25, 4, 1900.00),
-- Venta 8 (transaction_id 28)
(28, 83, 2, 24000.00),
(28, 85, 1, 35000.00),
-- Venta 9 (transaction_id 29)
(29, 87, 15, 700.00),
(29, 89, 12, 800.00),
-- Venta 10 (transaction_id 30)
(30, 91, 1, 19000.00),
(30, 93, 1, 10000.00),
-- Continúo con más ventas...
(31, 2, 8, 1800.00),
(31, 4, 5, 1500.00),
(32, 99, 1, 13500.00),
(32, 100, 2, 5500.00),
(33, 5, 2, 7000.00),
(33, 7, 1, 4500.00),
(34, 75, 4, 2800.00),
(34, 77, 6, 2500.00),
(35, 21, 6, 5500.00),
(35, 22, 4, 4500.00),
(36, 41, 1, 28000.00),
(36, 43, 1, 35000.00),
(37, 6, 2, 5000.00),
(37, 8, 1, 4800.00),
(38, 79, 10, 700.00),
(38, 81, 8, 2300.00),
(39, 101, 8, 700.00),
(39, 102, 6, 750.00),
(40, 87, 12, 700.00),
(40, 89, 8, 800.00),
(41, 31, 2, 13500.00),
(41, 33, 1, 5500.00),
(42, 51, 1, 18000.00),
(42, 53, 1, 28000.00),
(43, 91, 1, 19000.00),
(43, 93, 1, 10000.00),
(44, 25, 3, 1900.00),
(44, 27, 2, 1500.00),
(45, 99, 1, 13500.00),
(45, 100, 1, 5500.00),
(46, 71, 4, 2800.00),
(46, 73, 3, 1500.00),
(47, 83, 1, 24000.00),
(47, 85, 1, 35000.00),
(48, 61, 2, 24000.00),
(48, 63, 1, 35000.00),
(49, 21, 4, 5500.00),
(49, 23, 1, 13500.00),
(50, 1, 6, 2000.00),
(50, 3, 8, 1400.00);

-- =============================================
-- INSERTAR EXTRAS
-- =============================================
INSERT INTO extras (transaction_id, price, note, type) VALUES
-- Para compras (costos de envío principalmente)
(1, 2500.00, 'Envío express', 'Envio'),
(3, 3500.00, 'Envío urgente', 'Envio'),
(5, 1800.00, 'Envío estándar', 'Envio'),
(7, 4200.00, 'Envío express', 'Envio'),
(9, 2100.00, 'Envío normal', 'Envio'),
(11, 1500.00, 'Envío estándar', 'Envio'),
(13, 2800.00, 'Envío express', 'Envio'),
(15, 3100.00, 'Envío urgente', 'Envio'),
(17, 1900.00, 'Envío normal', 'Envio'),
(19, 2600.00, 'Envío express', 'Envio'),

-- Para ventas (mano de obra, envíos y descuentos)
(21, 1500.00, 'Instalación filtros', 'Mano de obra'),
(22, 800.00, 'Envío a domicilio', 'Envio'),
(23, 2500.00, 'Instalación pastillas', 'Mano de obra'),
(24, 1200.00, 'Envío express', 'Envio'),
(25, 1800.00, 'Instalación amortiguadores', 'Mano de obra'),
(26, 600.00, 'Envío local', 'Envio'),
(27, 500.00, 'Descuento cliente frecuente', 'Descuento'),
(28, 3500.00, 'Instalación neumáticos', 'Mano de obra'),
(29, 450.00, 'Envío estándar', 'Envio'),
(30, 2200.00, 'Instalación radiador', 'Mano de obra'),
(31, 1000.00, 'Descuento por volumen', 'Descuento'),
(32, 1600.00, 'Instalación bomba', 'Mano de obra'),
(33, 700.00, 'Envío rápido', 'Envio'),
(34, 1100.00, 'Instalación filtros', 'Mano de obra'),
(35, 900.00, 'Envío normal', 'Envio'),
(36, 4200.00, 'Instalación dirección', 'Mano de obra'),
(37, 800.00, 'Descuento fidelidad', 'Descuento'),
(38, 650.00, 'Envío local', 'Envio'),
(39, 1200.00, 'Instalación herramientas', 'Mano de obra'),
(40, 750.00, 'Envío express', 'Envio'),
(41, 1900.00, 'Instalación amortiguadores', 'Mano de obra'),
(42, 1100.00, 'Envío urgente', 'Envio'),
(43, 2800.00, 'Instalación refrigeración', 'Mano de obra'),
(44, 400.00, 'Descuento promocional', 'Descuento'),
(45, 1500.00, 'Instalación combustible', 'Mano de obra'),
(46, 850.00, 'Envío estándar', 'Envio'),
(47, 3800.00, 'Instalación neumáticos', 'Mano de obra'),
(48, 1300.00, 'Envío express', 'Envio'),
(49, 1700.00, 'Instalación frenos', 'Mano de obra'),
(50, 950.00, 'Envío normal', 'Envio');

-- =============================================
-- INSERTAR PAGOS
-- =============================================
INSERT INTO payments (transaction_id, amount, type, date) VALUES
-- Pagos para compras (normalmente un pago completo)
(1, 45000, 'Transferencia', '2024-01-15 10:30:00'),
(2, 28500, 'Transferencia', '2024-01-18 14:15:00'),
(3, 67500, 'Transferencia', '2024-01-22 09:45:00'),
(4, 38200, 'Transferencia', '2024-01-25 16:20:00'),
(5, 52800, 'Transferencia', '2024-01-28 11:10:00'),
(6, 31500, 'Transferencia', '2024-02-02 13:30:00'),
(7, 89400, 'Transferencia', '2024-02-05 08:50:00'),
(8, 42300, 'Transferencia', '2024-02-08 15:40:00'),
(9, 56700, 'Transferencia', '2024-02-12 10:25:00'),
(10, 33600, 'Transferencia', '2024-02-15 12:15:00'),
(11, 48900, 'Transferencia', '2024-02-20 14:35:00'),
(12, 29800, 'Transferencia', '2024-02-25 09:20:00'),
(13, 63200, 'Transferencia', '2024-03-01 16:45:00'),
(14, 27300, 'Transferencia', '2024-03-05 11:30:00'),
(15, 72100, 'Transferencia', '2024-03-10 13:50:00'),
(16, 35800, 'Transferencia', '2024-03-15 08:25:00'),
(17, 49500, 'Transferencia', '2024-03-20 15:10:00'),
(18, 41200, 'Transferencia', '2024-03-25 10:40:00'),
(19, 58600, 'Transferencia', '2024-03-28 12:55:00'),
(20, 32700, 'Transferencia', '2024-04-02 14:20:00'),

-- Pagos para ventas (pueden ser múltiples pagos)
(21, 8500, 'Efectivo', '2024-01-16 09:15:00'),
(22, 6000, 'Efectivo', '2024-01-19 10:30:00'),
(22, 6300, 'Transferencia', '2024-01-20 14:45:00'),
(23, 6700, 'Transferencia', '2024-01-23 11:20:00'),
(24, 10000, 'Efectivo', '2024-01-26 16:10:00'),
(24, 5400, 'Transferencia', '2024-01-27 09:30:00'),
(25, 9800, 'Efectivo', '2024-01-29 13:45:00'),
(26, 11200, 'Transferencia', '2024-02-03 08:20:00'),
(27, 7600, 'Efectivo', '2024-02-06 15:50:00'),
(28, 18900, 'Transferencia', '2024-02-09 10:35:00'),
(29, 8000, 'Efectivo', '2024-02-13 12:40:00'),
(29, 5500, 'Cheque', '2024-02-14 14:20:00'),
(30, 8900, 'Efectivo', '2024-02-16 09:55:00'),
(31, 16700, 'Transferencia', '2024-02-21 11:15:00'),
(32, 15000, 'Efectivo', '2024-02-26 16:30:00'),
(32, 7400, 'Transferencia', '2024-02-27 08:45:00'),
(33, 9300, 'Efectivo', '2024-03-02 13:25:00'),
(34, 14800, 'Transferencia', '2024-03-06 10:50:00'),
(35, 12000, 'Efectivo', '2024-03-11 15:35:00'),
(35, 7600, 'Transferencia', '2024-03-12 09:10:00'),
(36, 7800, 'Efectivo', '2024-03-16 12:20:00'),
(37, 12100, 'Transferencia', '2024-03-21 14:40:00'),
(38, 8400, 'Efectivo', '2024-03-26 11:55:00'),
(39, 10000, 'Efectivo', '2024-03-29 16:25:00'),
(39, 7200, 'Transferencia', '2024-03-30 08:15:00'),
(40, 10900, 'Efectivo', '2024-04-03 13:30:00'),
(41, 15700, 'Transferencia', '2024-04-08 10:45:00'),
(42, 8000, 'Efectivo', '2024-04-12 15:20:00'),
(42, 5800, 'Transferencia', '2024-04-13 09:40:00'),
(43, 9500, 'Efectivo', '2024-04-16 12:55:00'),
(44, 18300, 'Transferencia', '2024-04-20 14:10:00'),
(45, 6000, 'Efectivo', '2024-04-24 11:35:00'),
(45, 5600, 'Transferencia', '2024-04-25 16:50:00'),
(46, 8200, 'Efectivo', '2024-04-28 08:25:00'),
(47, 16500, 'Transferencia', '2024-05-02 13:45:00'),
(48, 7500, 'Efectivo', '2024-05-06 10:15:00'),
(48, 5400, 'Transferencia', '2024-05-07 15:30:00'),
(49, 7100, 'Efectivo', '2024-05-10 12:50:00'),
(50, 19800, 'Transferencia', '2024-05-14 14:05:00');

-- Habilitar verificación de claves foráneas
SET FOREIGN_KEY_CHECKS = 1;

-- =============================================
-- VERIFICAR DATOS INSERTADOS
-- =============================================
SELECT 'Datos insertados correctamente' as mensaje;
SELECT 'Usuarios:', COUNT(*) as total FROM users;
SELECT 'Categorías:', COUNT(*) as total FROM category;
SELECT 'Personas:', COUNT(*) as total FROM person;
SELECT 'Productos:', COUNT(*) as total FROM product;
SELECT 'Empresas de transporte:', COUNT(*) as total FROM transport_companies;
SELECT 'Transacciones:', COUNT(*) as total FROM transaction;
SELECT 'Items:', COUNT(*) as total FROM items;
SELECT 'Extras:', COUNT(*) as total FROM extras;
SELECT 'Pagos:', COUNT(*) as total FROM payments;

-- =============================================
-- EJEMPLO: CONSULTAR TOTAL DE UNA TRANSACCIÓN
-- =============================================
-- Ahora que no tenemos campo 'total', así es como obtenemos el total de una transacción:
SELECT 
    'Ejemplo: Total de transacción ID 21' as descripcion,
    t.transaction_id,
    t.date,
    COALESCE(SUM(i.quantity * i.price), 0) AS total_items,
    COALESCE(SUM(e.price), 0) AS total_extras,
    COALESCE(SUM(i.quantity * i.price), 0) + COALESCE(SUM(e.price), 0) AS total_transaccion,
    COALESCE(SUM(pa.amount), 0) AS total_pagado
FROM transaction t
LEFT JOIN items i ON t.transaction_id = i.transaction_id
LEFT JOIN extras e ON t.transaction_id = e.transaction_id
LEFT JOIN payments pa ON t.transaction_id = pa.transaction_id
WHERE t.transaction_id = 21
GROUP BY t.transaction_id, t.date; 