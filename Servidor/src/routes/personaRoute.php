<?php
    use Slim\Routing\RouteCollectorProxy;
    use Controllers\PersonaController;
    use Entities\Persona;

    $personaController = new PersonaController();

    $app->group("/personas", function(\Slim\Routing\RouteCollectorProxy $group) use ($personaController){
        $group->get("/show",[$personaController,"GetAllPersonas"]);
        $group->get("/show/{id}",[$personaController,"GetPersonaById"]);
        $group->post('/create', [$personaController, 'CreatePersona']);
        $group->delete('/delete/{id}', [$personaController, 'DeletePersona']);
        $group->put('/update/{id}', [$personaController, 'UpdatePersona']);
        

    });
    


?>