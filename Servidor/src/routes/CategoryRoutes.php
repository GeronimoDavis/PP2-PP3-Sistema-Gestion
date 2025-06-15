<?php
use Slim\Routing\RouteCollectorProxy;
use Controllers\CategoryController;

$categoryController = new CategoryController();

$app->group("/category", function(RouteCollectorProxy $group) use ($categoryController) {
    $group->get("/show", [$categoryController, "getAllcategories"]);
    $group->post("/create", [$categoryController, "createCategory"]);
});


?>