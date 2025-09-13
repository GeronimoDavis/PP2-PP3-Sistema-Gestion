<?php
namespace Controllers;

use Services\DashboardService;
use Entities\Transaction;
use Throwable;
use Exception;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Message\ResponseInterface as Response;

class DashboardController {
    private $dashboardService;

    public function __construct() {
        $this->dashboardService = new DashboardService();
    }

    public function getTotalSales(Request $request, Response $response, $args) {
        try {
            $totalSales = $this->dashboardService->getTotalSales();
            $response->getBody()->write(json_encode(['total_sales' => $totalSales]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        } catch (Throwable $e) {
            $response->getBody()->write(json_encode(['error' => 'Error fetching total sales: ' . $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function getTotalPurchases(Request $request, Response $response, $args) {
        try {
            $totalPurchases = $this->dashboardService->getTotalPurchases();
            $response->getBody()->write(json_encode(['total_purchases' => $totalPurchases]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        } catch (Throwable $e) {
            $response->getBody()->write(json_encode(['error' => 'Error fetching total purchases: ' . $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function getRecentTransactions(Request $request, Response $response, $args) {
        try {
            $limit = isset($args['limit']) ? (int)$args['limit'] : 10;
            $transactions = $this->dashboardService->getRecentTransactions($limit);
            // var_dump($transactions);
            //$transactionsArray = array_map(fn($t) => $t->toArray(), $transactions);
            $response->getBody()->write(json_encode(['recent_transactions' => $transactions]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        } catch (Throwable $e) {
            $response->getBody()->write(json_encode(['error' => 'Error fetching recent transactions: ' . $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function getProductsWithoutStock(Request $request, Response $response, $args)
    {
        try {
            $products = $this->dashboardService->getProductsWithoutStock();
            $productsArray = array_map(fn($p) => $p->toArray(), $products);
            $response->getBody()->write(json_encode(['products' => $productsArray]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        } catch (Throwable $e) {
            throw new Exception("Error fetching products without stock: " . $e->getMessage());
        }
    }   

}