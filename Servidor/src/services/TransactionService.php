<?php
namespace Services;

use Config\DataBase;
use Entities\Transaction;
use Exception;
use PDO;
use PDOException;

class TransactionService{
    
    private $pdo;
    public function __construct()
    {
        try {
            $this->pdo = DataBase::Connect();
        } catch (PDOException $e) {
            throw new Exception('Database connection error: ' . $e->getMessage());
        }
    }

    public function getAll(array $filters = []) {
        try{
            $query = "SELECT * FROM transaction WHERE 1=1";//consulta dinámica para filtrar
            $params = [];

            // Filtro por person_id (si se pasa en query params)
            if (isset($filters['person_id'])) {
                $query .= " AND person_id = ?";
                $params[] = $filters['person_id'];
            }

            if(isset($filters["transport_id"])){
                $query .= " AND transport_id = ?";
                $params[] = $filters['transport_id'];
            }

            if (isset($filters['is_sale'])) {
            $query .= " AND is_sale = ?";
            // Convertimos a entero 1 o 0 para que la bd lo entienda
            $params[] = filter_var($filters['is_sale'], FILTER_VALIDATE_BOOLEAN) ? 1 : 0;
            }

            if(isset($filters["date"])){
                $query .= " AND date = ?";
                $params[] = $filters['date'];
            }

              if (isset($filters['start_date'])) {
            $query .= " AND date >= ?";
            $params[] = $filters['start_date'];
            }

             if (isset($filters['end_date'])) {
            $query .= " AND date <= ?";
            $params[] = $filters['end_date'];
            }

            $query .= " ORDER BY date DESC";

            $stmt = $this->pdo->prepare($query);
            $stmt->execute($params);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $transactions = [];
            foreach ($rows as $row) {
                $transactions[] = new Transaction($row);
            }

            return $transactions;
        } catch (PDOException $e) {
            throw new Exception("Error al obtener las transacciones: " . $e->getMessage());
        }

    }
    
    public function getById(int $id){
        try {
            $stmt = $this->pdo->prepare("SELECT * FROM transaction WHERE transaction_id = ?");
            $stmt->execute([$id]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$row) {
                throw new Exception("Transaction not found with ID: $id");
            }

            return new Transaction($row);
        } catch (PDOException $e) {
            throw new Exception("Error fetching transaction by ID $id: " . $e->getMessage());
        }
    }

    public function create(Transaction $transaction){
        try {
            $stmt = $this->pdo->prepare("INSERT INTO transaction (date, is_sale, person_id, transport_id, tracking_number, tax_type) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $transaction->date,
                $transaction->is_sale,
                $transaction->person_id,
                $transaction->transport_id,
                $transaction->tracking_number,
                $transaction->tax_type
            ]);

            $transaction->transaction_id = $this->pdo->lastInsertId();
            return $transaction;
        } catch (PDOException $e) {
            throw new Exception("Error creating transaction: " . $e->getMessage());
        }
    }

    public function update(Transaction $transaction){
        try {
            $stmt = $this->pdo->prepare("UPDATE transaction SET date = ?, is_sale = ?, person_id = ?, transport_id = ?, tracking_number = ?, tax_type = ? WHERE transaction_id = ?");
            $stmt->execute([
                $transaction->date,
                $transaction->is_sale,
                $transaction->person_id,
                $transaction->transport_id,
                $transaction->tracking_number,
                $transaction->tax_type,
                $transaction->transaction_id
            ]);

            return $transaction;
        } catch (PDOException $e) {
            throw new Exception("Error updating transaction: " . $e->getMessage());
        }
    }

    public function delete(int $id){
        try {
            $stmt = $this->pdo->prepare("DELETE FROM transaction WHERE transaction_id = ?");
            $stmt->execute([$id]);

            if ($stmt->rowCount() === 0) {
                throw new Exception("Transaction not found with ID: $id");
            }
        } catch (PDOException $e) {
            throw new Exception("Error deleting transaction: " . $e->getMessage());
        }

    }

}
?>