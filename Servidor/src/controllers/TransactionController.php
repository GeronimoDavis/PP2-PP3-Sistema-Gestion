<?php
namespace Controllers;

use Services\TransactionService;
use Entities\Transaction;
use Throwable;
use Exception;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Message\ResponseInterface as Response;

class TransactionController{

    public function __construct()
    {
        $this->transactionService = new TransactionService();
    }

    public function getAllTransactions(Request $request, Response $response, $args){
        try{
            $transactions = $this->transactionService->getAll();
            $transactionsArray = array_map(fn($t) => $t->toArray(), $transactions);
            $response->getBody()->write(json_encode(['transactions' => $transactionsArray]));
            return $response->withHeader('Content-Type', 'application/json');
        }catch(Throwable $e){
            throw new Exception("Error fetching all transactions: " . $e->getMessage());
        }
    }

    public function getTransactionById(Request $request, Response $response, $args){
        try {
            $id = $args['id'];
            $transaction = $this->transactionService->getById($id);
            $response->getBody()->write(json_encode(['transaction' => $transaction->toArray()]));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (Throwable $e) {
            throw new Exception("Error fetching transaction by ID: " . $e->getMessage());
        }
    }

    
}

?>