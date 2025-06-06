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

    public function GetAllClients(Request $request, Response $response, $args)
    {
        try {
            $clients = $this->clientServices->GetAll();
            $response->getBody()->write(json_encode(['clientes'=>$clients]));
            return $response;
        } catch (\Throwable $e) {
          return "Error no se trajeron los clientes" . $e->getMessage();
          //slim espera que se retorne un response, no un string
        }
    }

    public function getClientById(Request $request, Response $response, $args)
    {
        try {
            $id = $args['id'];
            $client = $this->clientServices->GetById($id);
            $response->getBody()->write(json_encode(['cliente' => $client]));
            return $response;
        } catch (\Throwable $e) {
            $error = ['error' => 'No se trajeron los clientes', 'detalle' => $e->getMessage()];
            $response->getBody()->write(json_encode($error));
            return $response
                ->withHeader('Content-Type', 'application/json')
                ->withStatus(500);
        }
    }
}

?>