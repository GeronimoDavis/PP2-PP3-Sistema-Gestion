<?php

namespace Controllers;

use Services\PresupuestoService;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Message\ResponseInterface as Response;

class PresupuestoControllers {
    private $presupuestoService;

    public function __construct() {
        $this->presupuestoService = new PresupuestoService();
    }

    public function getAllPresupuestos(Request $request, Response $response, $args) {
        $presupuestos = $this->presupuestoService->getAll();
        $response->getBody()->write(json_encode($presupuestos));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
    }

    public function getPresupuestoById(Request $request, Response $response, $args) {
        $presupuesto = $this->presupuestoService->getById($args['id']);
        $response->getBody()->write(json_encode($presupuesto));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
    }

    public function createPresupuesto(Request $request, Response $response) {
        $presupuesto = $this->presupuestoService->create($request->getParsedBody());
        $response->getBody()->write(json_encode($presupuesto));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(201);
    }
    
    public function updatePresupuesto(Request $request, Response $response, $args) {
        $presupuesto = $this->presupuestoService->update($args['id'], $request->getParsedBody());
        $response->getBody()->write(json_encode($presupuesto));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
    }
    
    public function deletePresupuesto(Request $request, Response $response, $args) {
        $this->presupuestoService->delete($args['id']);
        $response->getBody()->write(json_encode(['message' => 'Presupuesto deleted successfully']));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(204);
    }
    
    public function getPresupuestoByDateRange(Request $request, Response $response, $args) {
        $startDate = new \DateTime($args['start_date']);
        $endDate = new \DateTime($args['end_date']);
        $presupuestos = $this->presupuestoService->getByDateRange($startDate, $endDate);
        $response->getBody()->write(json_encode($presupuestos));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
    }
    
    
}