<?php
use Slim\Routing\RouteCollectorProxy;
use Controllers\CSVController;
use Middlewares\AuthMiddleware;

$csvController = new CSVController();

$app->group('/csv', function(RouteCollectorProxy $group) use ($csvController) {
    $group->get('/sales', [$csvController, 'exportSales']);
});

?>
