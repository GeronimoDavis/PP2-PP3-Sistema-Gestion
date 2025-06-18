<?php
use Controllers\ProductController;
use Slim\Routing\RouteCollectorProxy;

$productController = new ProductController();

$app->group('/product', function(RouteCollectorProxy $group) use ($productController){

    $group->get('/show',[$productController,"getAllProducts"]);
    $group->get('/show/{id}',[$productController,'getProductById']);
    $group->post('/create',[$productController,'createProduct']);
    $group->put('/update/{id}' , [$productController, 'updateProduct']);

});