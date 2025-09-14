<?php
use Slim\Routing\RouteCollectorProxy;
use Controllers\DashboardController;
use Middlewares\AuthMiddleware;

$dashboardController = new DashboardController();

$app->group('/dashboard', function(RouteCollectorProxy $group) use ($dashboardController){
    $group->get('/total-sales', [$dashboardController, 'getTotalSales']);
    $group->get('/total-purchases', [$dashboardController, 'getTotalPurchases']);
    $group->get('/recent-transactions[/{limit}]', [$dashboardController, 'getRecentTransactions']);
    $group->get('/withoutStock', [$dashboardController, 'getProductsWithoutStock']);
});//->add(new AuthMiddleware());
