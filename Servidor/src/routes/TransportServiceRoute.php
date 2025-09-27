<?php
use Slim\Routing\RouteCollectorProxy;
use Controllers\TransportCompanyController;
use Middlewares\AuthMiddleware;

$transportCompanyController = new TransportCompanyController();

$app->group('/transportCompany', function(RouteCollectorProxy $group) use ($transportCompanyController) {
    $group->get('/show', [$transportCompanyController, 'getAllTransportCompanies']);
    $group->post('/create', [$transportCompanyController, 'createTransportCompany']);
    $group->delete('/delete/{id}', [$transportCompanyController, 'deleteTransportCompany']);
    $group->put('/update/{id}', [$transportCompanyController, 'updateTransportCompany']);
})->add(new AuthMiddleware());

