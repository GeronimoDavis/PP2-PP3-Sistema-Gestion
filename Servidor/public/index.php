<?php
require_once __DIR__ . '/../vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../'); 
$dotenv->load();

use Slim\Factory\AppFactory;
use Middlewares\CorsMiddleware;
use Slim\Routing\RouteCollectorProxy;


$app = AppFactory::create();

$app->addBodyParsingMiddleware();
$app->add(new CorsMiddleware());

require __DIR__ . '/../src/routes/PersonRoutes.php';
require __DIR__ . '/../src/routes/CategoryRoutes.php';
require __DIR__ . '/../src/routes/ProductRoute.php';
require __DIR__ . '/../src/routes/TransportServiceRoute.php';
require __DIR__ . '/../src/routes/ItemRoute.php';
require __DIR__ . '/../src/routes/TransactionRoutes.php';
require __DIR__ . '/../src/routes/ExtrasRoute.php';
require __DIR__ . '/../src/routes/PaymentsRoute.php';
require __DIR__ . '/../src/routes/UserRoutes.php';
require __DIR__ . '/../src/routes/DashboardRoutes.php';
require __DIR__ . '/../src/routes/CSVRoutes.php';


$app->run();
?>
