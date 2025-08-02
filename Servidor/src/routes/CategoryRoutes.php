<?php
use Slim\Routing\RouteCollectorProxy;
use Controllers\CategoryController;
use Middlewares\AuthMiddleware;

$categoryController = new CategoryController();

$app->group('/category', function(RouteCollectorProxy $group) use ($categoryController) {
    $group->get('/show', [$categoryController, 'getAllCategories']);
    $group->get('/show/{id}', [$categoryController, 'getCategoryById']);
    $group->post('/create', [$categoryController, 'createCategory']);
    $group->put('/update/{id}', [$categoryController, 'updateCategory']);
    $group->delete('/delete/{id}', [$categoryController, 'deleteCategory']);
})->add(new AuthMiddleware());

?>