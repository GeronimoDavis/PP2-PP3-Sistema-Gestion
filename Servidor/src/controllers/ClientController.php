<?php

namespace Controllers;
use Services\ClientServices;
use Entities\Persona;
use Throwable;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Message\ResponseInterface as Response;

class ClientController{
    private ClientServices $clientServices;

    public function __construct()
    {
        $this->clientServices = new ClientServices;
    }

    public function GetAllPersonas(Request $request, Response $response, $args)
    {
        try {
            $personas = $this->clientServices->GetAll();
            //convertir cada objeto Persona a un array asociativo para poder enviarlo como JSON
            $personasArray = array_map(fn($p) => $p->toArray(), $personas);

            $response->getBody()->write(json_encode(['personas'=>$personasArray]));
            return $response;
        } catch (Throwable $e) {
            $error = ['error' => 'No se pudieron obtener las personas', 'detalle' => $e->getMessage()];
            $response->getBody()->write(json_encode($error));
            return $response
                ->withHeader('Content-Type', 'application/json')
                ->withStatus(500);
          
        }
    }
    public function GetPersonaById(Request $request, Response $response, $args)
    {
        try {
            $id = $args['id'];
            $persona = $this->clientServices->GetById($id);
            $response->getBody()->write(json_encode(['persona' => $persona->toArray()]));//convertir el objeto Persona a un array asociativo
            return $response;
        } catch (Throwable $e) {
            $error = ['error' => 'No se pudo obtener la persona', 'detalle' => $e->getMessage()];
            $response->getBody()->write(json_encode($error));
            return $response
                ->withHeader('Content-Type', 'application/json')
                ->withStatus(500);
        }
    }

    public function CreatePersona(Request $request, Response $response, $args)
    {
        try {
            $data = $request->getParsedBody();//obtener los datos del cuerpo de la solicitud POST en formato JSON y convertirlos a un array asociativo
            $persona = new Persona($data);
            $createdPersona = $this->clientServices->Create($persona);
            $response->getBody()->write(json_encode(['persona' => $createdPersona->toArray()]));//convertir el objeto Persona a un array asociativo y enviarlo como JSON
            return $response
                ->withHeader('Content-Type', 'application/json')
                ->withStatus(201);
        }catch(Throwable $e) {
            $error = ['error' => 'No se pudo crear la persona', 'detalle' => $e->getMessage()];
            $response->getBody()->write(json_encode($error));
            return $response
                ->withHeader('Content-Type', 'application/json')
                ->withStatus(500);
        }
    }

      
    public function DeletePersona(Request $request, Response $response, $args){
        try{
            $id = $args["id"];
            $this->clientServices->delete($id);
            $response->getBody()->write(json_encode(['message' => 'Persona eliminada correctamente']));
            return $response
                ->withHeader('Content-Type', 'application/json')
                ->withStatus(200);
            
        }catch(Throwable $e){
            $error = ["error" => "No se pudo eliminar la persona", "detalle" => $e->getMessage()];
            $response->getBody()->write(json_encode($error));
            return $response
                ->withHeader('Content-Type', 'application/json')
                ->withStatus(500);
        }
    }

}

?>