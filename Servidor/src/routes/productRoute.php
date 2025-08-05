<?php
use Controllers\ProductController;
use Slim\Routing\RouteCollectorProxy;
use Middlewares\AuthMiddleware;

$productController = new ProductController();

$app->group('/product', function(RouteCollectorProxy $group) use ($productController){
    $group->get('/show',[$productController,"getAllProducts"]);
    $group->get('/show/{id}',[$productController,'getProductById']);
    $group->post('/create',[$productController,'createProduct']);
    $group->put('/update/{id}' , [$productController, 'updateProduct']);
    $group->delete('/delete/{id}', [$productController, 'deleteProduct']);
    $group->get('/code/{code}', [$productController, 'getProductByCode']);
    $group->get('/name/{name}', [$productController, 'getProductByName']);
    $group->get('/category/{category_id}', [$productController, 'getProductByCategory']);
    $group->get('/stock/{stock}', [$productController, 'getProductByStock']);
    $group->get('/purchasePrice/{price}', [$productController, 'getProductByPrice']);
    $group->get('/priceRange/{min}/{max}', [$productController, 'getProductByPriceRange']);
    $group->get('/stockRange/{min}/{max}', [$productController, 'getProductByStockRange']);
    $group->put('/updateStatus/{id}', [$productController, 'updateProductStatus']);

})->add(new AuthMiddleware());