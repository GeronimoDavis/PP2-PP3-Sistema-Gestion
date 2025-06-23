CREATE DATABASE IF NOT EXISTS stockRepuestos

use stockRepuestos;

create table if not EXISTS person (
	person_id int auto_increment not null unique, 
	tax_id varchar(11) not null, 
	company_name varchar(50) not null,
	name varchar(20),
	email varchar(30) not null,
	phone varchar(15) not null,
	notes tinytext,
	address varchar(20) not null,
	provider bool not null,
	tax_type enum("R.I",
	"Exento",
	"R.N.I",
	"Monotributo",
	"Consumidor Final"
	),
	primary key(person_id)
);

create TABLE users (
	user_id int primary key auto_increment unique,
	username varchar(20) not null unique,
	password varchar(255) not null,
	role enum("Administrador", "Contador") not null
	);

create table if not EXISTS category(
	category_id int primary key auto_increment unique,
	description varchar(30)
);

create table product(
	product_id int primary key auto_increment unique,
	description varchar(50),
	code varchar(20) not null,
	stock mediumint,
	purchase_price float,
	category_id int,
	foreign key(category_id) references category(category_id)
);


create table transport_companies(
	company_id int primary key auto_increment unique,
	name varchar(30),
	url varchar(40)
);

create table transaction(
	transaction_id int primary key auto_increment unique,
	date date,
	is_sale bool,
	person_id int,
	transport_id int, 
	tracking_number varchar(20),
	tax_type enum("R.I",
	"Exento",
	"R.N.I",
	"Monotributo",
	"Consumidor Final"
	),
	foreign key(person_id) references person(person_id),
	foreign key(transport_id) references transport_companies(company_id)	
);

create table items(
	item_id int primary key auto_increment,
	transaction_id int,
	product_id int,
	quantity mediumint,
	price float,
	foreign key(transaction_id) references transaction(transaction_id),
	foreign key(product_id) references product(product_id)
);

create table extras(
	extra_id int primary key auto_increment,
	transaction_id int not null,
	price float,
	note varchar(50),
	type enum("Mano de obra", "Envio", "Descuento"),
	foreign key(transaction_id) references transaction(transaction_id)
);

create table payments(
	payment_id int primary key auto_increment,
	transaction_id int,
	amount mediumint,
	type enum(
		"Efectivo",
		"Transferencia",
		"Cheque",
		"Otro"
	),
	date datetime,
	foreign key(transaction_id) references transaction(transaction_id)
);
