<?php
use Slim\Routing\RouteCollectorProxy;
use Controllers\DashboardController;
use Middlewares\AuthMiddleware;

$dashboardController = new DashboardController();

$app->group('/dashboard', function(RouteCollectorProxy $group) use ($dashboardController){
    $group->get('/totalSales', [$dashboardController, 'getTotalSales']);
    $group->get('/totalPurchases', [$dashboardController, 'getTotalPurchases']);
    $group->get('/recentTransactions[/{limit}]', [$dashboardController, 'getRecentTransactions']);
})->add(new AuthMiddleware());