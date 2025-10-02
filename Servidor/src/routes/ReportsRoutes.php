<?php

use Controllers\ReportsController;
use Middlewares\AuthMiddleware;

$app->group('/reports', function ($app) {
    $app->get('/sales-by-period', [ReportsController::class, 'getSalesByPeriod']);
    $app->get('/sales-by-category', [ReportsController::class, 'getSalesByCategory']);
    $app->get('/top-selling-products', [ReportsController::class, 'getTopSellingProducts']);
    $app->get('/sales-trends-by-category', [ReportsController::class, 'getSalesTrendsByCategory']);
})->add(new AuthMiddleware());
