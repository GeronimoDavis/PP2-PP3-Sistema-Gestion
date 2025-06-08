<?php

namespace Controllers;

use Services\ClientServices;
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
        } catch (\Throwable $e) {
            $error = ['error' => 'No se pudieron obtener las personas', 'detalle' => $e->getMessage()];
            $response->getBody()->write(json_encode($error));
            return $response
                ->withHeader('Content-Type', 'application/json')
                ->withStatus(500);
          
        }
    }
    public function getPersonaById(Request $request, Response $response, $args)
    {
        try {
            $id = $args['id'];
            $persona = $this->clientServices->GetById($id);
            $response->getBody()->write(json_encode(['perona' => $persona->toArray()]));//convertir el objeto Persona a un array asociativo
            return $response;
        } catch (\Throwable $e) {
            $error = ['error' => 'No se pudo obtener la persona', 'detalle' => $e->getMessage()];
            $response->getBody()->write(json_encode($error));
            return $response
                ->withHeader('Content-Type', 'application/json')
                ->withStatus(500);
        }
    }
}

?>