<?php
use Controllers\TransportCompanyController;
use Slim\Routing\RouteCollectorProxy;

$transportCompanyController = new TransportCompanyController();
$app->group('/transportCompany', function(RouteCollectorProxy $group) use ($transportCompanyController) {
    $group->get('/show', [$transportCompanyController, 'getAllTransportCompanies']);
    $group->post('/create', [$transportCompanyController, 'createTransportCompany']);
    $group->delete('/delete/{id}', [$transportCompanyController, 'deleteTransportCompany']);
    $group->put('/update/{id}', [$transportCompanyController, 'updateTransportCompany']);
});

