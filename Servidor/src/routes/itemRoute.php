<?php
use Controllers\ItemController;
use Slim\Routing\RouteCollectorProxy;

$itemController = new ItemController();
$app->group('/item',function(RouteCollectorProxy $group) use ($itemController){
   $group->get('/show', [$itemController, 'getAllItems']);
   $group->get('/show/{id}', [$itemController, 'getItemById']);
   $group->post('/create', [$itemController, 'createItem']);
   $group->put('/update/{id}', [$itemController, 'updateItem']);
   $group->delete('/delete/{id}', [$itemController, 'deleteItem']);
});