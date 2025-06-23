<?php
use Controllers\ExtrasController;
use Slim\Routing\RouteCollectorProxy;

$extrasController = new ExtrasController();
$app->group('/extras', function (RouteCollectorProxy $group) use ($extrasController) {
    $group->get('/show', [$extrasController, 'getAllExtras']);
    $group->get('/show/{id}', [$extrasController, 'getExtraById']);
    $group->post('/create', [$extrasController, 'createExtra']);
    $group->put('/update/{id}', [$extrasController, 'updateExtra']);
    $group->delete('/delete/{id}', [$extrasController, 'deleteExtra']);
});