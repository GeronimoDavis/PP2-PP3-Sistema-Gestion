<?php
    use Slim\Routing\RouteCollectorProxy;
    use Controllers\ClientController;

    $clientController = new ClientController();

    $app->group("/personas", function(\Slim\Routing\RouteCollectorProxy $group) use ($clientController){
        $group->get("/show",[$clientController,"GetAllPersonas"]);
        $group->get("/show/{id}",[$clientController,"GetPersonaById"]);
        $group->post('/create', [$clientController, 'CreatePersona']);
        $group->delete('/delete/{id}', [$clientController, 'DeletePersona']);

    });
    


?>