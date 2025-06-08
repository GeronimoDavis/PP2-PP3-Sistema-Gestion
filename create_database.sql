use stockRepuestos;

create table if not EXISTS  personas (
	id int auto_increment not null unique, 
	cuit varchar(11) not null, 
	razon_social varchar(50) not null,
	nombre varchar(20),
	mail varchar(30) not null,
	tel varchar(15) not null,
	observaciones tinytext,
	direccion varchar(20) not null,
	impuestos enum("R.I",
	"Excento",
	"R.N.I",
	"Monotributo",
	"Consumidor Final"
	),
	primary key(id)
);

create table if not exists categoria(
	id int primary key auto_increment unique,
	descripcion varchar(30)
);

create table repuestos(
	id int primary key auto_increment unique,
	description varchar(50),
	codigo varchar(20) not null,
	stock mediumint,
	precio_compra float,
	categoria_id int unsigned,
	foreign key(categoria_id) references categoria(id),
	precio_compra float
);


create table empresas_transporte(
	id int primary key auto_increment unique,
	nombre varchar(30),
	url varchar(40)
);

create table movimiento(
	id int primary key auto_increment unique,
	fecha date,
	compra_venta bool,
	id_persona int,
	transporte_id int, 
	guia varchar(20),
	impuesto enum("R.I",
	"Excento",
	"R.N.I",
	"Monotributo",
	"Consumidor Final"
	),
	foreign key(id_persona) references personas(id),
	foreign key(transporte_id) references empresas_transporte(id)	
);

create table items(
	id int primary key unique,
	id_movimiento int unsigned,
	id_repuesto int unsigned,
	cantidad mediumint,
	precio float
);
create table extras(
	id int primary key unique,
	id_movimiento int unsigned not null,
	precio float,
	observacion varchar(50),
	tipo enum("Mano de obra", "Envio", "Descuento")
);

create table pagos(
	id int primary key unique,
	id_movimiento int unsigned,
	cantidad mediumint,
	tipo enum(
		"efectivo",
		"transferencia",
		"cheque",
		"otro"
	),
	fecha date
);
-- creamos una funcion que nos permita insertar una persona y nos retorne el id de la persona insertada
delimiter //
create function insertPersona(
	cuit varchar(11), 
	razon_social varchar(50), 
	nombre varchar(20), 
	mail varchar(30), 
	tel varchar(15), 
	observaciones tinytext, 
	direccion varchar(20), 
	impuestos varchar(20)
) returns int
begin
	declare idPersona int;
	insert into personas(cuit, razon_social, nombre, mail, tel, observaciones, direccion, impuestos)
	values(cuit, razon_social, nombre, mail, tel, observaciones, direccion, impuestos);
	set idPersona = last_insert_id();
	return idPersona;
end //
delimiter ;
-- Creamos un procedimiento que nos permita obtener los repuestos y su categoria
delimiter //
create procedure repuestosAndCategoria()
begin
	select c.descripcion, r.description, r.codigo, r.stock, r.precio_compra 
	from repuestos r
	left join categoria c on r.categoria_id = c.id;
end //
delimiter ;
-- creamos una funcion que nos permita insertar un repuesto y nos retorne el id del repuesto insertado
delimiter //
create function insertRepuesto(
	description varchar(50), 
	codigo varchar(20), 
	stock mediumint, 
	precio_compra float, 
	categoria_id int unsigned
) returns int
begin
	declare idRepuesto int;
	insert into repuestos(description, codigo, stock, precio_compra, categoria_id)
	values(description, codigo, stock, precio_compra, categoria_id);
	set idRepuesto = last_insert_id();
	return idRepuesto;
end //
delimiter ;
-- Esta funcion calcula de manera estandarizada el precio de un repuesto la funcion tiene la siguiente forma y = x +(x * P) + m
delimiter //
create function calculatePrice(
	earn_percentage float,
	extra float,
	price float
)
returns float
begin
	declare total float;
	set total = price + extra + (price * earn_percentage / 100);
	return total;
end //
delimiter ;
-- Obtener los movimientos
delimiter //
create procedure getMovimientos()
begin
	select m.id, m.fecha, m.compra_venta, p.razon_social, e.nombre, m.guia, m.impuesto 
	from movimiento m 
	inner join personas p on m.id_persona = p.id
	left join empresas_transporte e on m.transporte_id = e.id;
end //
delimiter ;
-- Obtener los items de un movimiento
delimiter //
create procedure getItems(
	in id_movimiento int unsigned
)
begin
	select i.id, i.cantidad, i.precio, r.description, r.codigo 
	from items i 
	left join repuestos r on i.id_repuesto = r.id
	where i.id_movimiento = id_movimiento;
end //
delimiter ;