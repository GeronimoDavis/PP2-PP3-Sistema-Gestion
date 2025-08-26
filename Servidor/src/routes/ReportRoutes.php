<?php

use Slim\Routing\RouteCollectorProxy;
use Controllers\ReportController;
use Middlewares\AuthMiddleware;

$reportController = new ReportController();

$app->group('/reports', function(RouteCollectorProxy $group) use ($reportController) {
    $group->get('/sales-overview', [$reportController, 'getSalesOverview']);
    $group->get('/sales-by-category', [$reportController, 'getSalesByCategory']);
    $group->get('/top-selling-products', [$reportController, 'getTopSellingProducts']);
    $group->get('/sales-trends-by-category', [$reportController, 'getSalesTrendsByCategory']);
})->add(new AuthMiddleware());
