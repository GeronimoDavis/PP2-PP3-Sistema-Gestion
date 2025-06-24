<?php
use Slim\Routing\RouteCollectorProxy;
use Controllers\PersonController;

$personController = new PersonController();

$app->group("/person", function(RouteCollectorProxy $group) use ($personController) {
    $group->get("", [$personController, "getAllPersons"]);
    $group->get("/show/{id}", [$personController, "getPersonById"]);
    $group->post("/create", [$personController, "createPerson"]);
    $group->delete("/delete/{id}", [$personController, "deletePerson"]);
    $group->put("/update/{id}", [$personController, "updatePerson"]);
});
?>

