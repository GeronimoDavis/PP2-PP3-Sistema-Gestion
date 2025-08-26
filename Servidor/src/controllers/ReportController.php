<?php

namespace Controllers;

use Services\ReportesService;
use Throwable;
use Exception;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Message\ResponseInterface as Response;

class ReportController
{
    private ReportesService $reportesService;

    public function __construct()
    {
        $this->reportesService = new ReportesService();
    }

    public function getSalesOverview(Request $request, Response $response, $args)
    {
        try {
            $startDate = $request->getQueryParams()['startDate'] ?? null;
            $endDate = $request->getQueryParams()['endDate'] ?? null;

            if (!$startDate || !$endDate) {
                throw new Exception("Start date and end date are required.");
            }

            $data = $this->reportesService->getSalesOverview($startDate, $endDate);
            $response->getBody()->write(json_encode($data));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        } catch (Throwable $e) {
            $response->getBody()->write(json_encode(['error' => 'Error fetching sales overview: ' . $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function getSalesByCategory(Request $request, Response $response, $args)
    {
        try {
            $startDate = $request->getQueryParams()['startDate'] ?? null;
            $endDate = $request->getQueryParams()['endDate'] ?? null;

            if (!$startDate || !$endDate) {
                throw new Exception("Start date and end date are required.");
            }

            $data = $this->reportesService->getSalesByCategory($startDate, $endDate);
            $response->getBody()->write(json_encode($data));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        } catch (Throwable $e) {
            $response->getBody()->write(json_encode(['error' => 'Error fetching sales by category: ' . $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function getTopSellingProducts(Request $request, Response $response, $args)
    {
        try {
            $startDate = $request->getQueryParams()['startDate'] ?? null;
            $endDate = $request->getQueryParams()['endDate'] ?? null;

            if (!$startDate || !$endDate) {
                throw new Exception("Start date and end date are required.");
            }

            $data = $this->reportesService->getTopSellingProducts($startDate, $endDate);
            $response->getBody()->write(json_encode($data));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        } catch (Throwable $e) {
            $response->getBody()->write(json_encode(['error' => 'Error fetching top selling products: ' . $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function getSalesTrendsByCategory(Request $request, Response $response, $args)
    {
        try {
            $startDate = $request->getQueryParams()['startDate'] ?? null;
            $endDate = $request->getQueryParams()['endDate'] ?? null;
            $interval = $request->getQueryParams()['interval'] ?? 'monthly';

            if (!$startDate || !$endDate) {
                throw new Exception("Start date and end date are required.");
            }

            $data = $this->reportesService->getSalesTrendsByCategory($startDate, $endDate, $interval);
            $response->getBody()->write(json_encode($data));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        } catch (Throwable $e) {
            $response->getBody()->write(json_encode(['error' => 'Error fetching sales trends by category: ' . $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }
}
