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

create table if not EXISTS categoria(
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

