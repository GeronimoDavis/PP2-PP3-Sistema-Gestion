
# Proyecto de Gestión de Personas y Stock

##  Arquitectura General

El proyecto está desarrollado en **PHP** utilizando el framework **Slim**.

### Capas principales:

- **Entidades (Entities):**  
  Clases que representan los objetos del dominio. (Al momento solo está `Person`).

- **Servicios (Services):**  
  Contienen la lógica de negocio y el acceso a base de datos usando PDO. (Al momento solo está `PersonService`).

- **Controladores (Controllers):**  
  Reciben las peticiones HTTP, llaman a los servicios y devuelven respuestas JSON. (Al momento solo está `PersonController`).

- **Rutas (Routes):**  
  Definen los endpoints y asignan el controlador y método a utilizar. (Al momento solo está `personRoutes`).

- **Configuración (Config):**  
  Archivos para configurar la base de datos y establecer conexión.

---

## Estructura de Carpetas

/src
   /controllers  # Controladores que gestionan la lógica HTTP
   /entities     # Clases que representan entidades de negocio
   /services     # Servicios con lógica de negocio y acceso a BD
   /routes       # Define rutas y agrupamientos de las mismas

/config # Configuración de base de datos

/public # Punto de entrada para las peticiones HTTP


---

##  Base de Datos

**Base:** `stockRepuestos`

| Tabla               | Descripción                                                | Campos Clave |
|---------------------|------------------------------------------------------------|--------------|
| `person`            | Personas relacionadas con transacciones                   | `person_id`, `tax_id`, `company_name`, `email`, `address`, `tax_type`, `provider` |
| `category`          | Categorías de productos                                   | `category_id`, `description` |
| `product`           | Productos disponibles                                     | `product_id`, `description`, `code`, `stock`, `purchase_price`, `category_id` |
| `transport_companies` | Empresas de transporte                                   | `company_id`, `name`, `url` |
| `transaction`       | Registros de ventas o compras                             | `transaction_id`, `date`, `is_sale`, `person_id`, `transport_id`, `tracking_number`, `tax_type` |
| `items`             | Productos incluidos en cada transacción                   | `item_id`, `transaction_id`, `product_id`, `quantity`, `price` |
| `extras`            | Costos adicionales o descuentos                           | `extra_id`, `transaction_id`, `price`, `note`, `type` |
| `payments`          | Pagos realizados por transacción                          | `payment_id`, `transaction_id`, `amount`, `type`, `date` |

---

##  Entidades

### `Person`

Representa a una persona y/o empresa como cliente o proveedor.

#### Propiedades:

- `id` (int|null)
- `cuit` (string)
- `razon_social` (string)
- `nombre` (string|null)
- `mail` (string)
- `tel` (string)
- `observaciones` (string|null)
- `direccion` (string)
- `impuestos` (string)

#### Métodos:

- `__construct(array $data)`
- `toArray(): array`

---

##  Servicios

### `PersonService`

- Se conecta a la base de datos mediante PDO, definida en `Config\DataBase`.

#### Métodos:

| Método              | Descripción |
|---------------------|-------------|
| `GetAll()`          | Retorna todas las personas |
| `GetById($id)`      | Retorna una persona por ID |
| `Create(Persona $p)`| Inserta un nuevo registro |
| `Update(Persona $p)`| Actualiza persona existente |
| `Delete($id)`       | Elimina persona por ID |

---

##  Controladores

### `PersonController`

- Recibe peticiones HTTP y llama a `PersonService`.
- Devuelve respuestas JSON.

#### Métodos:

| Método                          | Acción                      |
|---------------------------------|-----------------------------|
| `GetAllPersonas()`              | Devuelve todas las personas |
| `GetPersonaById($request, $response, $args)` | Devuelve persona por ID |
| `CreatePersona($request, $response)` | Crea una nueva persona |
| `UpdatePersona($request, $response, $args)` | Actualiza persona por ID |
| `DeletePersona($request, $response, $args)` | Elimina persona por ID |

---

##  Rutas

Definidas en `personRoutes.php` y agrupadas bajo `/personas`:

| Ruta                        | Método HTTP | Acción             |
|-----------------------------|-------------|--------------------|
| `/person/show`              | GET         | Obtener todos      |
| `/person/show/{id}`         | GET         | Obtener por ID     |
| `/person/create`            | POST        | Crear              |
| `/person/update/{id}`       | PUT         | Actualizar         |
| `/person/delete/{id}`       | DELETE      | Eliminar           |

---

##  Configuración

### `config/DataBase.php`

- Maneja la conexión con PDO a la base de datos `stockRepuestos`.
- Configura host, usuario y contraseña.

### `composer.json`

- Usa autoload **PSR-4** con estructura modular.

json
"autoload": {
  "psr-4": {
    "Controllers\\": "src/controllers/",
    "Services\\": "src/services/",
    "Config\\": "config/",
    "Entities\\": "src/entities/"
  }
}




### .gitignore

- /Servidor/vendor
- /Servidor/composer.lock
- /vendor/

### Pasos a futuro
•	Agregar middleware para autenticación y control de accesos.
•	Manejar tokens seguridad(hablarlo con Lautaro, David y Agustin para para tenerlos como guia).
•	Añadir validaciones como por ejemplo “CUIT válido”.
•	Implementar manejo de productos, categorías, transacciones, pagos en servicios y aquellos que surjan en el desarrollo del proyecto.
•	Agregar tests unitarios y de integración.(hablarlo con Lautaro, David y Agustin para para tenerlos como guia)
•	Implementar Frontend.



