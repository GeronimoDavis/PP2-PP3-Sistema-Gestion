<?php

namespace Controller;

use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Message\ResponseInterface as Response;
class ClientController
{
    public function Prueba(Request $request, Response $response, $args)
    {
        $response->getBody()->write("Hello world!");
        return $response;
    }
}

?>