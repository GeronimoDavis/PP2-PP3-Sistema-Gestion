<?php
use Slim\Routing\RouteCollectorProxy;
use Controllers\UserController;

$userController = new UserController();

$app->group('/user', function (RouteCollectorProxy $group) use ($userController) {
    $group->post('/register', [$userController, 'register']);
    $group->post('/login', [$userController, 'login']);
    $group->post('/recover-pass', [$userController, 'recoverPass']);
}); 