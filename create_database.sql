use stockRepuestos;

create table if not EXISTS  person (
	person_id int auto_increment not null unique, 
	cuit varchar(11) not null, 
	razon_social varchar(50) not null,
	nombre varchar(20),
	mail varchar(30) not null,
	tel varchar(15) not null,
	observaciones tinytext,
	direccion varchar(20) not null,
	impuestos enum("R.I",
	"Exento",
	"R.N.I",
	"Monotributo",
	"Consumidor Final"
	),
	primary key(person_id)
);

create table if not EXISTS category(
	category_id int primary key auto_increment unique,
	description varchar(30)
);

create table products(
	product_id int primary key auto_increment unique,
	description varchar(50),
	codigo varchar(20) not null,
	stock mediumint,
	precio_compra float,
	category_id int,
	foreign key(category_id) references category(category_id)
);


create table empresas_transporte(
	empresa_id int primary key auto_increment unique,
	nombre varchar(30),
	url varchar(40)
);

create table movimiento(
	movimiento_id int primary key auto_increment unique,
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
	foreign key(id_persona) references person(person_id),
	foreign key(transporte_id) references empresas_transporte(empresa_id)	
);

create table items(
	item_id int primary key auto_increment,
	movimiento_id int,
	product_id int,
	cantidad mediumint,
	precio float,
	foreign key(movimiento_id) references movimiento(movimiento_id),
	foreign key(product_id) references products(product_id)
);
create table extras(
	extra_id int primary key auto_increment,
	movimiento_id int not null,
	precio float,
	observacion varchar(50),
	tipo enum("Mano de obra", "Envio", "Descuento"),
	foreign key(movimiento_id) references movimiento(movimiento_id)
);

create table pagos(
	pago_id int primary key auto_increment,
	movimiento_id int,
	cantidad mediumint,
	tipo enum(
		"efectivo",
		"transferencia",
		"cheque",
		"otro"
	),
	fecha date,
	foreign key(movimiento_id) references movimiento(movimiento_id)
);