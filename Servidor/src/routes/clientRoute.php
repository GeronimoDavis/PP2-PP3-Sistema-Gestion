<?php
    use Slim\Routing\RouteCollectorProxy;
    use Controllers\ClientController;

    $clientController = new ClientController();

    $app->group("/client", function(\Slim\Routing\RouteCollectorProxy $group) use ($clientController){
        $group->get("/show",[$clientController,"GetAllClients"]);
        $group->get("/show/{id}",[$clientController,"getClientById"]);

    });
    


?>