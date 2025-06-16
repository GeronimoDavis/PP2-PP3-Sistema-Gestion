<?php
use Slim\Routing\RouteCollectorProxy;
use Controllers\CategoryController;

$categoryController = new CategoryController();

$app->group("/category", function(RouteCollectorProxy $group) use ($categoryController) {
    $group->get("/show", [$categoryController, "getAllcategories"]);
    $group->get("", [$categoryController, "getCategoryByDescription"]);//para acceder /category?description=valor
    $group->post("/create", [$categoryController, "createCategory"]);
    $group->put("/update/{id}", [$categoryController, "updateCategory"]);
});


?>