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
            $transaction = new Transaction($data);
            $createdTransaction = $this->transactionService->create($transaction);
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
    
}

?>