# Proyecto de Gestion de Personas, Stock y Usuarios

## Arquitectura General

El proyecto esta desarrollado en **PHP** utilizando el framework **Slim** y sigue una arquitectura modular y escalable.

### Capas principales:

- **Entidades (Entities):**  
  Clases que representan los objetos del dominio. Incluye `Person`, `Product`, `Category`, `Usuario`, `Transaction`, `Item`, `Extras`, `Payments`, `TransportCompany`.

- **Servicios (Services):**  
  Contienen la logica de negocio y el acceso a base de datos usando PDO. Ejemplo: `PersonService`, `ProductService`, `UserService`, etc.

- **Controladores (Controllers):**  
  Reciben las peticiones HTTP, llaman a los servicios y devuelven respuestas JSON. Ejemplo: `PersonController`, `ProductController`, `UserController`, etc.

- **Rutas (Routes):**  
  Definen los endpoints y asignan el controlador y metodo a utilizar. Cada entidad tiene su propio archivo de rutas.

- **Middlewares:**  
  Encargados de la autenticacion y autorizacion (por ejemplo, `AuthMiddleware` para validar JWT en rutas protegidas).

- **Configuracion (Config):**  
  Archivos para configurar la base de datos y establecer conexion, y la clave secreta para JWT.

---

## Estructura de Carpetas

/src
   /controllers  # Controladores que gestionan la logica HTTP
   /entities     # Clases que representan entidades de negocio
   /services     # Servicios con logica de negocio y acceso a BD
   /routes       # Define rutas y agrupamientos de las mismas
   /middlewares  # Middlewares para autenticacion y autorizacion

/config # Configuracion de base de datos y JWT

/public # Punto de entrada para las peticiones HTTP

---

## Base de Datos

**Base:** `stockRepuestos`

| Tabla                 | Descripcion                                                | Campos Clave |
|-----------------------|-----------------------------------------------------------|--------------|
| `users`               | Usuarios del sistema (login, roles)                       | `user_id`, `username`, `password`, `role` |
| `person`              | Personas relacionadas con transacciones                   | `person_id`, `tax_id`, `company_name`, `email`, `address`, `tax_type`, `provider` |
| `category`            | Categorias de productos                                  | `category_id`, `description` |
| `product`             | Productos disponibles                                    | `product_id`, `description`, `code`, `stock`, `purchase_price`, `category_id` |
| `transport_companies` | Empresas de transporte                                   | `company_id`, `name`, `url` |
| `transaction`         | Registros de ventas o compras                            | `transaction_id`, `date`, `is_sale`, `person_id`, `transport_id`, `tracking_number`, `tax_type` |
| `items`               | Productos incluidos en cada transaccion                  | `item_id`, `transaction_id`, `product_id`, `quantity`, `price` |
| `extras`              | Costos adicionales o descuentos                          | `extra_id`, `transaction_id`, `price`, `note`, `type` |
| `payments`            | Pagos realizados por transaccion                         | `payment_id`, `transaction_id`, `amount`, `type`, `date` |

---

## Entidades

### `Usuario`
Representa a un usuario del sistema (login, roles).
- `user_id` (int|null)
- `username` (string)
- `password` (string, hasheada)
- `role` (string)

### `Person`
Representa a una persona y/o empresa como cliente o proveedor.
- `person_id` (int|null)
- `tax_id` (string)
- `company_name` (string)
- `email` (string)
- `address` (string)
- `tax_type` (string)
- `provider` (bool)

### `Product`, `Category`, `Transaction`, `Item`, `Extras`, `Payments`, `TransportCompany`
Cada una representa su entidad correspondiente en la base de datos, con sus campos y metodos `__construct(array $data)` y `toArray(): array`.

---

## Servicios

### Ejemplo: `UserService`
- Se conecta a la base de datos mediante PDO, definida en `Config\DataBase`.
- Hashea la contrasena al crear usuarios.
- Permite buscar usuarios por username y validar login.

#### Metodos:
| Metodo                | Descripcion |
|-----------------------|-------------|
| `findByUsername()`    | Busca usuario por username |
| `create(Usuario $u)`  | Inserta un nuevo usuario (hasheando la contrasena) |

### Otros servicios
- `PersonService`, `ProductService`, etc. implementan logica de negocio y acceso a datos para sus entidades.

---

## Controladores

### Ejemplo: `UserController`
- Recibe peticiones HTTP para login y registro.
- Devuelve JWT al hacer login exitoso.

#### Metodos:
| Metodo      | Accion |
|-------------|--------|
| `register`  | Registra un nuevo usuario |
| `login`     | Verifica credenciales y devuelve JWT |

### Otros controladores
- `PersonController`, `ProductController`, etc. gestionan las operaciones CRUD de sus entidades.

---

## Rutas

Cada entidad tiene su propio archivo de rutas, agrupadas bajo un prefijo. Ejemplo:

| Ruta                        | Metodo HTTP | Accion             |
|-----------------------------|-------------|--------------------|
| `/user/register`            | POST        | Registrar usuario  |
| `/user/login`               | POST        | Login y obtener JWT|
| `/product/show`             | GET         | Obtener productos  |
| `/product/show/{id}`        | GET         | Obtener por ID     |
| `/product/create`           | POST        | Crear producto     |
| `/product/update/{id}`      | PUT         | Actualizar producto|
| `/product/delete/{id}`      | DELETE      | Eliminar producto  |
| `/category/show`            | GET         | Obtener categorias |
| `/category/show/{id}`       | GET         | Obtener por ID     |
| `/category/create`          | POST        | Crear categoria    |
| `/category/update/{id}`     | PUT         | Actualizar categoria|
| `/category/delete/{id}`     | DELETE      | Eliminar categoria |
| ...                         | ...         | ...                |

**Nota:** Todas las rutas (excepto `/user/login` y `/user/register`) requieren autenticacion JWT.

---

## Middlewares

### `AuthMiddleware`
- Protege las rutas de la API validando el token JWT enviado en el header `Authorization: Bearer <token>`.
- Si el token es invalido o falta, responde con error 401.
- Se aplica a todos los grupos de rutas principales (productos, categorias, personas, transacciones, etc.).

---

## Configuracion

### `config/DataBase.php`
- Maneja la conexion con PDO a la base de datos `stockRepuestos`.
- Define la clave secreta para JWT en la variable estatica `$JWT_SECRET`.

### `composer.json`
- Usa autoload **PSR-4** con estructura modular.

```json
"autoload": {
  "psr-4": {
    "Controllers\\": "src/controllers/",
    "Services\\": "src/services/",
    "Config\\": "config/",
    "Entities\\": "src/entities/",
    "Middlewares\\": "src/middlewares/"
  }
}
```

### .gitignore
- /Servidor/vendor
- /Servidor/composer.lock
- /vendor/

---

## Seguridad y Buenas Practicas

- Las contrasenas de usuarios se almacenan hasheadas (bcrypt).
- El login devuelve un JWT que debe ser enviado en el header Authorization para acceder a rutas protegidas.
- El middleware de autenticacion valida el JWT en cada peticion.
- Las rutas de login y registro son publicas, el resto requieren autenticacion.
- Validaciones de datos en controladores y servicios para evitar datos malformados.

---

## Pasos a futuro
- Agregar middleware para autorizacion por roles (por ejemplo, solo admin puede eliminar productos).
- Mejorar validaciones especificas (ejemplo: CUIT valido, emails, etc).
- Implementar manejo completo de productos, categorias, transacciones, pagos y demas entidades.
- Agregar tests unitarios y de integracion.(hablar con el agustin y lautaro)
- Implementar frontend moderno (React,nextJS,twig).

---

