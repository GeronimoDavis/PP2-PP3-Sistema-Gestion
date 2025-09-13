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

require __DIR__ . '/../src/routes/personRoutes.php';
require __DIR__ . '/../src/routes/categoryRoutes.php';
require __DIR__ . '/../src/routes/productRoute.php';
require __DIR__ . '/../src/routes/transportServiceRoute.php';
require __DIR__ . '/../src/routes/itemRoute.php';
require __DIR__ . '/../src/routes/transactionRoutes.php';
require __DIR__ . '/../src/routes/extrasRoute.php';
require __DIR__ . '/../src/routes/paymentsRoute.php';
require __DIR__ . '/../src/routes/userRoutes.php';
require __DIR__ . '/../src/routes/DashboardRoutes.php';
require __DIR__ . '/../src/routes/CSVRoutes.php';


$app->run();
?>
