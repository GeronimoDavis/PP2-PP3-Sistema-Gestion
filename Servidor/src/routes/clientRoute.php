<?php
    use Slim\Routing\RouteCollectorProxy;
    use Controllers\ClientController;

    $clientController = new ClientController();

    $app->group("/personas", function(\Slim\Routing\RouteCollectorProxy $group) use ($clientController){
        $group->get("/show",[$clientController,"GetAllPersonas"]);
        $group->get("/show/{id}",[$clientController,"getPersonaById"]);
        $group->post('/create', [$clientController, 'CreatePersona']);

    });
    


?>