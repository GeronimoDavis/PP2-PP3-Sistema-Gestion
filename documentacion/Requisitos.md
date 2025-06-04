# Requisitos del Proyecto

## Documentación de requerimientos

El presente documento presenta los requisitos iniciales de un sistema de gestión de repuestos y reparaciones en el sector agropecuario.

---

## Índice

1. [Login](#1-login)
2. [Repuestos](#2-repuestos)
3. [Personas](#3-personas)
4. [Categorías](#4-categorías)
5. [Movimientos](#5-movimientos)
6. [Reportes](#6-reportes)

---

## 1. Login

El sistema debe contar con un login que permita el ingreso a un usuario registrado con su nombre (mail) y contraseña. Esto es para que solo los usuarios registrados puedan acceder tanto a la edición como a la lectura de datos, manteniendo la información privada y segura.

### 1.1 Requisitos de login

- El sistema tendrá una pantalla de ingreso donde cada usuario debe colocar su correo y contraseña.
- Solo los usuarios registrados podrán acceder.

---

## 2. Repuestos

Para la gestión de productos/repuestos, el sistema debe permitir el registro de categorías y luego la carga de repuestos. Los usuarios registrados con los permisos necesarios podrán crear, leer, editar y eliminar repuestos.

### 2.1 Requisitos de repuestos

- Se podrán registrar y organizar repuestos por categorías.
- Se podrá ver, editar, eliminar o agregar repuestos.
- Se puede modificar el precio al momento de efectuar un movimiento, aunque haya un precio estándar.

#### 2.1.1 Datos para cada repuesto

- Nombre
- Código
- Categoría (elegida de una lista)
- Stock disponible
- Precio de compra (opcional)
- Precio de venta (opcional)
- Descripción (opcional)

---

## 3. Personas

El sistema debe permitir a los usuarios registrados con permisos la gestión de personas (clientes, proveedores o ambos), incluyendo búsqueda, creación, edición y baja.

### 3.1 Requisitos de personas

- Se podrá registrar información de personas que pueden ser clientes, proveedores o ambos.
- Se podrá buscar fácilmente por:
  - Nombre
  - Razón social
  - CUIT
- Se podrá agregar, editar y dar de baja personas.

#### 3.1.1 Datos que se cargarán para cada persona

- CUIT
- Razón social
- Nombre (opcional)
- Email
- Teléfono (se prioriza uso por WhatsApp)
- Dirección fiscal
- Condición frente al IVA
- Observaciones (opcional)

---

## 4. Categorías

Para tener una lista de categorías de repuestos, se deben crear manualmente desde un formulario por un usuario autorizado.

- Deben tener el campo “nombre”.

### 4.1 Notas Generales

- No se borrará definitivamente ningún dato, solo se dará de baja para mantener historial.
- Todos los precios se manejarán en valor dólar oficial, pero podrán actualizarse cuando se necesite.
- En el futuro se puede conectar con AFIP/ARCA para ver el estado fiscal de las personas.

---

## 5. Movimientos

El sistema de movimientos debe contemplar compras, ventas y pagos a proveedores. Se registrarán productos como mano de obra, repuestos nuevos y usados, incluyendo descuentos.

### 5.1 Requisitos del sistema de movimientos

- Los clientes pueden ser proveedores y viceversa.
- Se prefiere estandarizar todos los precios.
- Los precios deben poder actualizarse incluso antes de que se efectúe el pago.
- Un pago se considera realizado cuando fue acreditado totalmente.
- Los precios de ventas y compras son en dólar oficial (por ahora).
- Los pagos a clientes son personalizados y flexibles (interés depende del tiempo de pago).
- Cobros adicionales se ingresan como mano de obra.

---

## 6. Reportes

El sistema contará con reportes que brindarán una visión clara del estado operativo y financiero de la empresa, facilitando la toma de decisiones.

### 6.1 Requisitos de reportes

#### 6.1.1 Informe de Ventas

- Detalle de todas las ventas realizadas en un período determinado.
- Información agrupada por cliente, tipo de cliente, fecha, tipo de servicio o repuesto.
- Total facturado, total cobrado y saldo pendiente.
- Comparativas mensuales o anuales sobre evolución de ventas.

#### 6.1.2 Lista de Deudas a Proveedores

- Detalle de compras realizadas a cada proveedor.
- Monto total adeudado por proveedor.
- Estado de cuenta: facturas pendientes y pagos realizados.
- Fechas de vencimiento próximas.
- Identificación de facturas vencidas.

#### 6.1.3 Control de Stock

- Inventario actualizado de repuestos e insumos.
- Cantidad disponible por ítem.
- Registro de movimientos: ingresos por compras y egresos por ventas o uso.
- Alerta automática al alcanzar el stock mínimo configurado.
