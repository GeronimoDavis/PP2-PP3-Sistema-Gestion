<?php
namespace Controllers;

use Services\TransactionService;
use Entities\Transaction;
use Throwable;
use Exception;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Message\ResponseInterface as Response;

class TransactionController{

    private TransactionService $transactionService;

    public function __construct()
    {
        $this->transactionService = new TransactionService();
    }

    public function getAllTransactions(Request $request, Response $response, $args){
        try{
            $filtres = $request->getQueryParams();
            $transactions = $this->transactionService->getAll($filtres);
            $transactionsArray = array_map(fn($t) => $t->toArray(), $transactions);
            $response->getBody()->write(json_encode(['transactions' => $transactionsArray]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        }catch(Throwable $e){
            $response->getBody()->write(json_encode(['error' => 'Error fetching transactions: ' . $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function getTransactionById(Request $request, Response $response, $args){
        try {
            $id = $args['id'];
            $transaction = $this->transactionService->getById($id);

            if (!$transaction) {
                $response->getBody()->write(json_encode(['error' => 'Transaction not found with ID: ' . $id]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

            $response->getBody()->write(json_encode(['transaction' => $transaction->toArray()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        } catch (Throwable $e) {
            $response->getBody()->write(json_encode(['error' => 'Error fetching transaction by ID: ' . $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function createTransaction(Request $request, Response $response, $args){
        try{
            $data = $request->getParsedBody();
            //validaciones
            if (!isset($data['date'], $data['is_sale'], $data['person_id'], $data['tax_type'])) {
                throw new Exception("Missing required fields: date, is_sale, person_id, tax_type");
            }

            if (!is_numeric($data['person_id']) || $data['person_id'] <= 0) {
                throw new Exception("Invalid person ID.");
            }

            // transport_id puede ser null para ventas locales
            if (isset($data['transport_id']) && $data['transport_id'] !== null && (!is_numeric($data['transport_id']) || $data['transport_id'] <= 0)) {
                throw new Exception("Invalid transport ID.");
            }

            $validTaxTypes = ["R.I", "Exento", "R.N.I", "Monotributo", "Consumidor Final"];
            if (!in_array($data['tax_type'], $validTaxTypes)) {
                throw new Exception("Invalid tax type.");
            }

            $transaction = new Transaction($data);
            $createdTransaction = $this->transactionService->create($transaction);
            
            // Procesar items si existen
            if (isset($data['items']) && is_array($data['items'])) {
                try {
                    $itemService = new \Services\ItemService();
                    foreach ($data['items'] as $itemData) {
                        $item = new \Entities\Item([
                            'transaction_id' => $createdTransaction->transaction_id,
                            'product_id' => $itemData['product_id'],
                            'quantity' => $itemData['quantity'],
                            'price' => $itemData['price']
                        ]);
                        $itemService->createItem($item);
                    }
                } catch (Exception $e) {
                    error_log("Error creating items: " . $e->getMessage());
                    throw new Exception("Error creating items: " . $e->getMessage());
                }
            }
            
            // Procesar extras si existen
            if (isset($data['extras']) && is_array($data['extras'])) {
                try {
                    $extrasService = new \Services\ExtrasService();
                    foreach ($data['extras'] as $extraData) {
                        $extra = new \Entities\Extras(
                            0, // extra_id se asigna automáticamente
                            $createdTransaction->transaction_id,
                            (float)$extraData['price'],
                            $extraData['note'],
                            \Entities\ExtrasType::from($extraData['type'])
                        );
                        $extrasService->create($extra);
                    }
                } catch (Exception $e) {
                    error_log("Error creating extras: " . $e->getMessage());
                    throw new Exception("Error creating extras: " . $e->getMessage());
                }
            }
            
            $response->getBody()->write(json_encode(['transaction' => $createdTransaction->toArray()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(201);
        }catch(Throwable $e){
            $response->getBody()->write(json_encode(['error' => 'Error creating transaction: ' . $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }
    

    public function updateTransaction(Request $request, Response $response , $args){
        try{
            $id = $args['id'];
            $data = $request->getParsedBody();
            
            //validaciones
            if (!isset($data['date'], $data['is_sale'], $data['person_id'], $data['tax_type'])) {
                throw new Exception("Missing required fields: date, is_sale, person_id, tax_type");
            }

            if (!is_numeric($data['person_id']) || $data['person_id'] <= 0) {
                throw new Exception("Invalid person ID.");
            }

            // transport_id puede ser null para ventas locales
            if (isset($data['transport_id']) && $data['transport_id'] !== null && (!is_numeric($data['transport_id']) || $data['transport_id'] <= 0)) {
                throw new Exception("Invalid transport ID.");
            }

            $validTaxTypes = ["R.I", "Exento", "R.N.I", "Monotributo", "Consumidor Final"];
            if (!isset($data['tax_type']) || !in_array($data['tax_type'], $validTaxTypes)) {
                throw new Exception("Invalid tax type.");
            }

            $transaction = new Transaction($data);
            $transaction->transaction_id = $id;
            $transactionUpdated = $this->transactionService->update($transaction);
            $response->getBody()->write(json_encode(['transaction' => $transactionUpdated->toArray()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        }catch(Throwable $e){
            $response->getBody()->write(json_encode(['error' => 'Error updating transaction: ' . $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function deleteTransaction(Request $request, Response $response, $args){
        try {
            $id = $args['id'];
            $this->transactionService->delete($id);
            $response->getBody()->write(json_encode(['message' => 'Transaction deleted successfully']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        } catch (Throwable $e) {
            $response->getBody()->write(json_encode(['error' => 'Error deleting transaction: ' . $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function getSalesHistory(Request $request, Response $response, $args){
        try{
            $filters = $request->getQueryParams();
            $filters['is_budget'] = false; // Excluir presupuestos del historial de ventas
            
            $sales = $this->transactionService->getSalesWithDetails($filters);
            $total = $this->transactionService->getSalesCount($filters);
            
            $response->getBody()->write(json_encode([
                'sales' => $sales,
                'total' => $total
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        }catch(Throwable $e){
            $response->getBody()->write(json_encode([
                'error' => 'Error fetching sales history: ' . $e->getMessage()
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function getSaleDetails(Request $request, Response $response, $args){
        try {
            $id = $args['id'];
            $saleDetails = $this->transactionService->getSaleDetailsById($id);
            $response->getBody()->write(json_encode($saleDetails));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        } catch (Throwable $e) {
            $response->getBody()->write(json_encode(['error' => 'Error fetching sale details: ' . $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function getPurchasesHistory(Request $request, Response $response, $args){
        try{
            $filters = $request->getQueryParams();
            
            $purchases = $this->transactionService->getPurchasesWithDetails($filters);
            $total = $this->transactionService->getPurchasesCount($filters);
            
            $response->getBody()->write(json_encode([
                'purchases' => $purchases,
                'total' => $total
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        }catch(Throwable $e){
            $response->getBody()->write(json_encode([
                'error' => 'Error fetching purchases history: ' . $e->getMessage()
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function getPurchaseDetails(Request $request, Response $response, $args){
        try {
            $id = $args['id'];
            $purchaseDetails = $this->transactionService->getPurchaseDetailsById($id);
            $response->getBody()->write(json_encode($purchaseDetails));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        } catch (Throwable $e) {
            $response->getBody()->write(json_encode(['error' => 'Error fetching purchase details: ' . $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function getBudgetsHistory(Request $request, Response $response, $args){
        try{
            $filters = $request->getQueryParams();
            
            // Agregar filtro para solo presupuestos
            $filters['is_budget'] = true;
            
            $budgets = $this->transactionService->getSalesWithDetails($filters);
            $total = $this->transactionService->getSalesCount($filters);
            
            $response->getBody()->write(json_encode([
                'budgets' => $budgets,
                'total' => $total
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        }catch(Throwable $e){
            $response->getBody()->write(json_encode([
                'error' => 'Error fetching budgets history: ' . $e->getMessage()
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function getBudgetDetails(Request $request, Response $response, $args){
        try{
            $id = $args['id'];
            $budget = $this->transactionService->getSaleDetailsById($id);
            
            if (!$budget) {
                $response->getBody()->write(json_encode(['error' => 'Budget not found with ID: ' . $id]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }
            
            $response->getBody()->write(json_encode(['budget' => $budget]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        }catch(Throwable $e){
            $response->getBody()->write(json_encode(['error' => 'Error fetching budget details: ' . $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }
    
}
?>