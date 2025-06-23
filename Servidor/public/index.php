<?php
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Factory\AppFactory;

require __DIR__ . '/../vendor/autoload.php';

$app = AppFactory::create();
$app->addBodyParsingMiddleware();

require __DIR__ . '/../src/routes/personRoutes.php';
require __DIR__ . '/../src/routes/categoryRoutes.php';

require __DIR__ . '/../src/routes/productRoute.php';
require __DIR__ . '/../src/routes/transportServiceRoute.php';
require __DIR__ . '/../src/routes/itemRoute.php';

require __DIR__ . '/../src/routes/transactionRoutes.php';

$app->run();
?>
