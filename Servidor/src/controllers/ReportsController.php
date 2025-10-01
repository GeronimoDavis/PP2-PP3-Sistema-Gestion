<?php
namespace Controllers;

use Services\ReportsService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class ReportsController
{
    private $reportsService;

    public function __construct()
    {
        $this->reportsService = new ReportsService();
    }

    public function getSalesByPeriod(Request $request, Response $response, $args)
    {
        $params = $request->getQueryParams();
        $from = $params['from'] ?? null;
        $to = $params['to'] ?? null;
        $period = $params['period'] ?? 'monthly';

        if (!$from || !$to) {
            $response->getBody()->write(json_encode(['error' => 'Date range parameters are required']));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        $data = $this->reportsService->getSalesByPeriod($from, $to, $period);
        $response->getBody()->write(json_encode($data));
        return $response->withHeader('Content-Type', 'application/json');
    }

    public function getSalesByCategory(Request $request, Response $response, $args)
    {
        $params = $request->getQueryParams();
        $from = $params['from'] ?? null;
        $to = $params['to'] ?? null;

        if (!$from || !$to) {
            $response->getBody()->write(json_encode(['error' => 'Date range parameters are required']));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        $data = $this->reportsService->getSalesByCategory($from, $to);
        $response->getBody()->write(json_encode($data));
        return $response->withHeader('Content-Type', 'application/json');
    }

    public function getTopSellingProducts(Request $request, Response $response, $args)
    {
        $params = $request->getQueryParams();
        $from = $params['from'] ?? null;
        $to = $params['to'] ?? null;
        $limit = $params['limit'] ?? 5;

        if (!$from || !$to) {
            $response->getBody()->write(json_encode(['error' => 'Date range parameters are required']));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        $data = $this->reportsService->getTopSellingProducts($from, $to, $limit);
        $response->getBody()->write(json_encode($data));
        return $response->withHeader('Content-Type', 'application/json');
    }

    public function getSalesTrendsByCategory(Request $request, Response $response, $args)
    {
        $params = $request->getQueryParams();
        $from = $params['from'] ?? null;
        $to = $params['to'] ?? null;

        if (!$from || !$to) {
            $response->getBody()->write(json_encode(['error' => 'Date range parameters are required']));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        $data = $this->reportsService->getSalesTrendsByCategory($from, $to);
        $response->getBody()->write(json_encode($data));
        return $response->withHeader('Content-Type', 'application/json');
    }
}

