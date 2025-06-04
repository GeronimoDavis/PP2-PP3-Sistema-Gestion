<?php
    use Slim\Routing\RouteCollectorProxy;
    use Controller\ClientController;

    $clientController = new ClientController();

    $app->group("/client", function(\Slim\Routing\RouteCollectorProxy $group) use ($clientController){
        $group->get("/prueba",[$clientController,"Prueba"]);

    });
    


?>