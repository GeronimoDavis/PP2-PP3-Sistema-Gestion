<?php
use Slim\Routing\RouteCollectorProxy;
use Controllers\PaymentsController;
use Middlewares\AuthMiddleware;

$paymentsController = new PaymentsController();

$app->group('/payments', function(RouteCollectorProxy $group) use ($paymentsController) {
    $group->get('/show', [$paymentsController, 'getAllPayments']);
    $group->get('/show/{id}', [$paymentsController, 'getPaymentById']);
    $group->post('/create', [$paymentsController, 'createPayment']);
    $group->put('/update/{id}', [$paymentsController, 'updatePayment']);
    $group->delete('/delete/{id}', [$paymentsController, 'deletePayment']);
    $group->get('/transaction/{transactionId}', [$paymentsController, 'getPaymentsByTransactionId']);
    $group->get('/type/{type}', [$paymentsController, 'getPaymentsByType']);
    $group->get('/date/{date}', [$paymentsController, 'getPaymentsByDate']);
    $group->get("/status/{transactionId}", [$paymentsController, 'getPaymentStatus']);
    $group->get('/person/{person_id}', [$paymentsController, 'getPaymentsByPersonId']);
})->add(new AuthMiddleware());
    