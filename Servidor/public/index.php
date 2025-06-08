<?php
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Factory\AppFactory;


require __DIR__ . '/../vendor/autoload.php';

$app = AppFactory::create();
$app->addbodyParsingMiddleware();//esta linea permite que el servidor pueda recibir datos en formato JSON en el cuerpo de la solicitud


require __DIR__ . '/../src/routes/clientRoute.php';



$app->run();
?>