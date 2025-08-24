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

    public function getSalesWithDetails(array $filters = []) {
        try {
            
            $query = "
                SELECT 
                    t.transaction_id,
                    t.date,
                    t.is_sale,
                    t.tax_type,
                    t.tracking_number,
                    p.person_id,
                    p.name as client_name,
                    p.company_name as client_company,
                    p.email as client_email,
                    p.phone as client_phone,
                    tc.name as transport_company,
                    tc.url as transport_url,
                    COALESCE(SUM(i.quantity * i.price), 0) as total_items,
                    COALESCE(SUM(e.price), 0) as total_extras,
                    COALESCE(SUM(i.quantity * i.price), 0) + COALESCE(SUM(e.price), 0) as total_transaction,
                    COALESCE(SUM(pa.amount), 0) as total_paid,
                    COUNT(DISTINCT i.item_id) as items_count,
                    COUNT(DISTINCT e.extra_id) as extras_count,
                    COUNT(DISTINCT pa.payment_id) as payments_count
                FROM transaction t
                LEFT JOIN person p ON t.person_id = p.person_id
                LEFT JOIN transport_companies tc ON t.transport_id = tc.company_id
                LEFT JOIN items i ON t.transaction_id = i.transaction_id
                LEFT JOIN extras e ON t.transaction_id = e.transaction_id
                LEFT JOIN payments pa ON t.transaction_id = pa.transaction_id
                WHERE t.is_sale = 1
            ";
            
            $params = [];

            // Aplicar filtros
            if (isset($filters['start_date'])) {
                $query .= " AND t.date >= ?";
                $params[] = $filters['start_date'];
            }

            if (isset($filters['end_date'])) {
                $query .= " AND t.date <= ?";
                $params[] = $filters['end_date'];
            }

            if (isset($filters['client_name'])) {
                $query .= " AND (p.name LIKE ? OR p.company_name LIKE ?)";
                $searchTerm = '%' . $filters['client_name'] . '%';
                $params[] = $searchTerm;
                $params[] = $searchTerm;
            }

            if (isset($filters['transaction_id'])) {
                $query .= " AND t.transaction_id = ?";
                $params[] = $filters['transaction_id'];
            }

            $query .= " GROUP BY t.transaction_id, t.date, t.is_sale, t.tax_type, t.tracking_number, p.person_id, p.name, p.company_name, p.email, p.phone, tc.name, tc.url, t.transport_id";
            $query .= " ORDER BY t.date DESC";

            // Aplicar limite y offset para paginacion 
            if (isset($filters['limit'])) {
                $query .= " LIMIT ?";
                $params[] = (int)$filters['limit'];
                
                if (isset($filters['offset'])) {
                    $query .= " OFFSET ?";
                    $params[] = (int)$filters['offset'];
                }
            }

            $stmt = $this->pdo->prepare($query);
            
            // Bind parameters con tipos correctos
            foreach ($params as $index => $param) {
                $paramType = is_int($param) ? PDO::PARAM_INT : PDO::PARAM_STR;
                $stmt->bindValue($index + 1, $param, $paramType);
            }
            
            $stmt->execute();
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return $rows;
        } catch (PDOException $e) {
            throw new Exception("Error al obtener ventas con detalles: " . $e->getMessage());
        }
    }

    public function getSalesCount(array $filters = []) {
        try {
            $query = "
                SELECT COUNT(DISTINCT t.transaction_id) as total
                FROM transaction t
                LEFT JOIN person p ON t.person_id = p.person_id
                WHERE t.is_sale = 1
            ";
            
            $params = [];

            // Aplicar filtros 
            if (isset($filters['start_date'])) {
                $query .= " AND t.date >= ?";
                $params[] = $filters['start_date'];
            }

            if (isset($filters['end_date'])) {
                $query .= " AND t.date <= ?";
                $params[] = $filters['end_date'];
            }

            if (isset($filters['client_name'])) {
                $query .= " AND (p.name LIKE ? OR p.company_name LIKE ?)";
                $searchTerm = '%' . $filters['client_name'] . '%';
                $params[] = $searchTerm;
                $params[] = $searchTerm;
            }

            if (isset($filters['transaction_id'])) {
                $query .= " AND t.transaction_id = ?";
                $params[] = $filters['transaction_id'];
            }

            $stmt = $this->pdo->prepare($query);
            
            // Bind parameters con tipos correctos
            foreach ($params as $index => $param) {
                $paramType = is_int($param) ? PDO::PARAM_INT : PDO::PARAM_STR;
                $stmt->bindValue($index + 1, $param, $paramType);
            }
            
            $stmt->execute();
            $result = $stmt->fetch(PDO::FETCH_ASSOC);

            return (int)$result['total'];
        } catch (PDOException $e) {
            throw new Exception("Error al contar ventas: " . $e->getMessage());
        }
    }

    public function getSaleDetailsById(int $transactionId) {
        try {
            // Obtener informacion basica de la transaccion
            $transactionQuery = "
                SELECT 
                    t.*,
                    p.name as client_name,
                    p.company_name as client_company,
                    p.email as client_email,
                    p.phone as client_phone,
                    p.tax_id as client_tax_id,
                    tc.name as transport_company,
                    tc.url as transport_url
                FROM transaction t
                LEFT JOIN person p ON t.person_id = p.person_id
                LEFT JOIN transport_companies tc ON t.transport_id = tc.company_id
                WHERE t.transaction_id = ? AND t.is_sale = 1
            ";
            
            $stmt = $this->pdo->prepare($transactionQuery);
            $stmt->execute([$transactionId]);
            $transaction = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$transaction) {
                throw new Exception("Venta no encontrada con ID: $transactionId");
            }

            // Obtener items de la transaccion
            $itemsQuery = "
                SELECT 
                    i.*,
                    p.name as product_name,
                    p.code as product_code,
                    p.purchase_price as product_cost
                FROM items i
                LEFT JOIN product p ON i.product_id = p.product_id
                WHERE i.transaction_id = ?
                ORDER BY i.item_id
            ";
            
            $stmt = $this->pdo->prepare($itemsQuery);
            $stmt->execute([$transactionId]);
            $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Obtener extras de la transaccion
            $extrasQuery = "
                SELECT * FROM extras 
                WHERE transaction_id = ?
                ORDER BY extra_id
            ";
            
            $stmt = $this->pdo->prepare($extrasQuery);
            $stmt->execute([$transactionId]);
            $extras = $stmt->fetchAll(PDO::FETCH_ASSOC);

                // Obtener pagos de la transaccion
            $paymentsQuery = "
                SELECT * FROM payments 
                WHERE transaction_id = ?
                ORDER BY date
            ";
            
            $stmt = $this->pdo->prepare($paymentsQuery);
            $stmt->execute([$transactionId]);
            $payments = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Calcular totales
            $totalItems = array_sum(array_map(fn($item) => $item['quantity'] * $item['price'], $items));
            $totalExtras = array_sum(array_map(fn($extra) => $extra['price'], $extras));
            $totalTransaction = $totalItems + $totalExtras;
            $totalPaid = array_sum(array_map(fn($payment) => $payment['amount'], $payments));

            return [
                'transaction' => $transaction,
                'items' => $items,
                'extras' => $extras,
                'payments' => $payments,
                'totals' => [
                    'items' => $totalItems,
                    'extras' => $totalExtras,
                    'transaction' => $totalTransaction,
                    'paid' => $totalPaid,
                    'pending' => $totalTransaction - $totalPaid
                ]
            ];
        } catch (PDOException $e) {
            throw new Exception("Error al obtener detalles de la venta: " . $e->getMessage());
        }
    }

    public function getAllSales() {
        try {
            $query = "SELECT * FROM view_ventas_detalladas";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute();
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            return $rows;
        } catch (PDOException $e) {
            throw new Exception("Error al obtener todas las ventas: " . $e->getMessage());
        }
    }
}
?>