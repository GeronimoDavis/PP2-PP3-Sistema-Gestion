<?php

namespace Controllers;
use Services\PersonaServices;
use Entities\Persona;
use Throwable;
use Exception;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Message\ResponseInterface as Response;

class PersonaController{
    private PersonaServices $personaServices;

    public function __construct()
    {
        $this->personaServices = new PersonaServices;
    }

    public function GetAllPersonas(Request $request, Response $response, $args)
    {
        try {
            $personas = $this->personaServices->GetAll();
            //convertir cada objeto Persona a un array asociativo para poder enviarlo como JSON
            $personasArray = array_map(fn($p) => $p->toArray(), $personas);

            $response->getBody()->write(json_encode(['personas'=>$personasArray]));
            return $response;
        } catch (Throwable $e) {
            throw new Exception("Error al traer todas las personas: " . $e->getMessage());
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }
    public function GetPersonaById(Request $request, Response $response, $args)
    {
        try {
            $id = $args['id'];
            $persona = $this->personaServices->GetById($id);
            $response->getBody()->write(json_encode(['persona' => $persona->toArray()]));//convertir el objeto Persona a un array asociativo
            return $response;
        } catch (Throwable $e) {
            throw new Exception("Error seleccionar la persona por id: " . $e->getMessage());
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function CreatePersona(Request $request, Response $response, $args)
    {
        try {
            $data = $request->getParsedBody();//obtener los datos del cuerpo de la solicitud POST en formato JSON y convertirlos a un array asociativo
            $persona = new Persona($data);
            $createdPersona = $this->personaServices->Create($persona);
            $response->getBody()->write(json_encode(['persona' => $createdPersona->toArray()]));//convertir el objeto Persona a un array asociativo y enviarlo como JSON
            return $response
                ->withHeader('Content-Type', 'application/json')
                ->withStatus(201);
        }catch (Throwable $e) {
            throw new Exception("Error al crear la persona: " . $e->getMessage());
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

      
    public function DeletePersona(Request $request, Response $response, $args){
        try{
            $id = $args["id"];
            $this->personaServices->delete($id);
            $response->getBody()->write(json_encode(['message' => 'Persona eliminada correctamente']));
            return $response
                ->withHeader('Content-Type', 'application/json')
                ->withStatus(200);
            
        }catch (Throwable $e) {
            throw new Exception("Error no se pudo eliminar la persona: " . $e->getMessage());
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }
    public function UpdatePersona(Request $request,Response $response, $args)
    {
        try {
            $id = $args['id'];
            $data = $request->getParsedBody();
            $persona = new Persona($data);
            $persona->id = $id; 
            $this->personaServices->Update($persona);
            $response->getBody()->write(json_encode(['message' => 'Persona actualizada correctamente']));
            return $response
                ->withHeader('Content-Type', 'application/json')
                ->withStatus(200);
            
            
        } catch (Throwable $e) {
            throw new Exception("Error al actualizar la persona: " . $e->getMessage());
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }

    }

}

?>