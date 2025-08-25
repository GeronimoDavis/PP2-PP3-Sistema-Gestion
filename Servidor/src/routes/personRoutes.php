<?php
use Slim\Routing\RouteCollectorProxy;
use Controllers\PersonController;
use Middlewares\AuthMiddleware;

$personController = new PersonController();

$app->group("/person", function(RouteCollectorProxy $group) use ($personController) {
    $group->get("/show", [$personController, "getAllPersons"]);
    $group->get("/activeclients", [$personController, "getAllActiveClients"]);
    $group->get("/show/{id}", [$personController, "getPersonById"]);
    $group->post("/create", [$personController, "createPerson"]);
    $group->put("/updateStatus/{id}",[$personController, "updatePersonStatus"]);// no borra, se desactiva
    $group->put("/update/{id}", [$personController, "updatePerson"]);
})
->add(new AuthMiddleware());

?>
