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
            $stmt = $this->pdo->prepare("INSERT INTO transaction (date, is_sale, person_id, transport_id, tracking_number, tax_type, has_tax) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $transaction->date,
                $transaction->is_sale,
                $transaction->person_id,
                $transaction->transport_id,
                $transaction->tracking_number,
                $transaction->tax_type,
                $transaction->has_tax
            ]);

            $transaction->transaction_id = $this->pdo->lastInsertId();
            return $transaction;
        } catch (PDOException $e) {
            throw new Exception("Error creating transaction: " . $e->getMessage());
        }
    }

    public function update(Transaction $transaction){
        try {
            $stmt = $this->pdo->prepare("UPDATE transaction SET date = ?, is_sale = ?, person_id = ?, transport_id = ?, tracking_number = ?, tax_type = ?, has_tax = ? WHERE transaction_id = ?");
            $stmt->execute([
                $transaction->date,
                $transaction->is_sale,
                $transaction->person_id,
                $transaction->transport_id,
                $transaction->tracking_number,
                $transaction->tax_type,
                $transaction->has_tax,
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
                    transaction_id,
                    date,
                    tracking_number,
                    tax_type,
                    person_id,
                    person_name as client_name,
                    company_name as client_company,
                    email as client_email,
                    phone as client_phone,
                    transport_company,
                    transport_id,
                    total_items,
                    total_extras,
                    total_descuentos,
                    total_a_pagar as total_transaction,
                    total_pagado as total_paid,
                    saldo_restante
                FROM view_ventas_detalladas
                WHERE 1=1
            ";
            
            $params = [];

            // Aplicar filtros
            if (isset($filters['start_date'])) {
                $query .= " AND date >= ?";
                $params[] = $filters['start_date'];
            }

            if (isset($filters['end_date'])) {
                $query .= " AND date <= ?";
                $params[] = $filters['end_date'];
            }

            if (isset($filters['client_name'])) {
                $query .= " AND (person_name LIKE ? OR company_name LIKE ?)";
                $searchTerm = '%' . $filters['client_name'] . '%';
                $params[] = $searchTerm;
                $params[] = $searchTerm;
            }

            if (isset($filters['transaction_id'])) {
                $query .= " AND transaction_id = ?";
                $params[] = $filters['transaction_id'];
            }

            // Ordenamiento
            $sortBy = 'date'; // Default sort
            if (isset($filters['sort_by'])) {
                switch ($filters['sort_by']) {
                    case 'transaction_id':
                        $sortBy = 'transaction_id';
                        break;
                    case 'client_name':
                        $sortBy = 'client_name';
                        break;
                    case 'total_transaction':
                        $sortBy = 'total_transaction';
                        break;
                    case 'total_paid':
                        $sortBy = 'total_paid';
                        break;
                    case 'status':
                        $sortBy = 'status';
                        break;
                }
            }
            
            $sortDirection = isset($filters['sort_direction']) && strtoupper($filters['sort_direction']) === 'ASC' ? 'ASC' : 'DESC';

            if ($sortBy === 'status') {
                $query .= " ORDER BY 
                    CASE 
                        WHEN total_paid >= total_transaction THEN 2 -- Pagado
                        WHEN total_paid > 0 AND total_paid < total_transaction THEN 1 -- Parcial
                        ELSE 0 -- Pendiente
                    END $sortDirection, date DESC";
            } else {
                $query .= " ORDER BY $sortBy $sortDirection";
            }

 
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

            // Agregar campos adicionales que el frontend espera
            foreach ($rows as &$row) {
                $row['is_sale'] = 1; // Siempre es venta
                $row['items_count'] = 0; // Se puede calcular si es necesario
                $row['extras_count'] = 0; // Se puede calcular si es necesario
                $row['payments_count'] = 0; // Se puede calcular si es necesario
            }

            return $rows;
        } catch (PDOException $e) {
            throw new Exception("Error al obtener ventas con detalles: " . $e->getMessage());
        }
    }

    public function getSalesCount(array $filters = []) {
        try {
            $query = "
                SELECT COUNT(*) as total
                FROM view_ventas_detalladas
                WHERE 1=1
            ";
            
            $params = [];

            // Aplicar filtros 
            if (isset($filters['start_date'])) {
                $query .= " AND date >= ?";
                $params[] = $filters['start_date'];
            }

            if (isset($filters['end_date'])) {
                $query .= " AND date <= ?";
                $params[] = $filters['end_date'];
            }

            if (isset($filters['client_name'])) {
                $query .= " AND (person_name LIKE ? OR company_name LIKE ?)";
                $searchTerm = '%' . $filters['client_name'] . '%';
                $params[] = $searchTerm;
                $params[] = $searchTerm;
            }

            if (isset($filters['transaction_id'])) {
                $query .= " AND transaction_id = ?";
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
            // Obtener informacion basica de la transaccion desde la vista
            $transactionQuery = "
                SELECT 
                    transaction_id,
                    date,
                    tracking_number,
                    tax_type,
                    person_id,
                    person_name as client_name,
                    company_name as client_company,
                    email as client_email,
                    phone as client_phone,
                    transport_company,
                    transport_id,
                    total_items,
                    total_extras,
                    total_descuentos,
                    total_a_pagar,
                    total_pagado,
                    saldo_restante
                FROM view_ventas_detalladas
                WHERE transaction_id = ?
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

            // Usar los totales de la vista en lugar de calcularlos manualmente
            return [
                'transaction' => $transaction,
                'items' => $items,
                'extras' => $extras,
                'payments' => $payments,
                'totals' => [
                    'items' => $transaction['total_items'],
                    'extras' => $transaction['total_extras'],
                    'transaction' => $transaction['total_a_pagar'],
                    'paid' => $transaction['total_pagado'],
                    'pending' => $transaction['saldo_restante']
                ]
            ];
        } catch (PDOException $e) {
            throw new Exception("Error al obtener detalles de la venta: " . $e->getMessage());
        }
    }

    public function getPurchasesWithDetails(array $filters = []) {
        try {
            $query = "
                SELECT 
                    transaction_id,
                    date,
                    tracking_number,
                    tax_type,
                    person_id,
                    person_name as provider_name,
                    company_name as provider_company,
                    email as provider_email,
                    phone as provider_phone,
                    transport_company,
                    transport_id,
                    total_items,
                    total_extras,
                    total_descuentos,
                    total_a_pagar as total_transaction,
                    total_pagado as total_paid,
                    saldo_restante
                FROM view_compras_detalladas
                WHERE 1=1
            ";
            
            $params = [];

            // Aplicar filtros
            if (isset($filters['start_date'])) {
                $query .= " AND date >= ?";
                $params[] = $filters['start_date'];
            }

            if (isset($filters['end_date'])) {
                $query .= " AND date <= ?";
                $params[] = $filters['end_date'];
            }

            if (isset($filters['provider_name'])) {
                $query .= " AND (person_name LIKE ? OR company_name LIKE ?)";
                $searchTerm = '%' . $filters['provider_name'] . '%';
                $params[] = $searchTerm;
                $params[] = $searchTerm;
            }

            if (isset($filters['transaction_id'])) {
                $query .= " AND transaction_id = ?";
                $params[] = $filters['transaction_id'];
            }

            // Ordenamiento
            $sortBy = 'date'; // Default sort
            if (isset($filters['sort_by'])) {
                switch ($filters['sort_by']) {
                    case 'transaction_id':
                        $sortBy = 'transaction_id';
                        break;
                    case 'provider_name':
                        $sortBy = 'provider_name';
                        break;
                    case 'total_transaction':
                        $sortBy = 'total_transaction';
                        break;
                    case 'total_paid':
                        $sortBy = 'total_paid';
                        break;
                    case 'status':
                        $sortBy = 'status';
                        break;
                }
            }
            
            $sortDirection = isset($filters['sort_direction']) && strtoupper($filters['sort_direction']) === 'ASC' ? 'ASC' : 'DESC';

            if ($sortBy === 'status') {
                $query .= " ORDER BY 
                    CASE 
                        WHEN total_paid >= total_transaction THEN 2 -- Pagado
                        WHEN total_paid > 0 AND total_paid < total_transaction THEN 1 -- Parcial
                        ELSE 0 -- Pendiente
                    END $sortDirection, date DESC";
            } else {
                $query .= " ORDER BY $sortBy $sortDirection";
            }

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

            // Agregar campos adicionales que el frontend espera
            foreach ($rows as &$row) {
                $row['is_sale'] = 0; // Siempre es compra
                $row['items_count'] = 0; // Se puede calcular si es necesario
                $row['extras_count'] = 0; // Se puede calcular si es necesario
                $row['payments_count'] = 0; // Se puede calcular si es necesario
            }

            return $rows;
        } catch (PDOException $e) {
            throw new Exception("Error al obtener compras con detalles: " . $e->getMessage());
        }
    }

    public function getPurchasesCount(array $filters = []) {
        try {
            $query = "
                SELECT COUNT(*) as total
                FROM view_compras_detalladas
                WHERE 1=1
            ";
            
            $params = [];

            // Aplicar filtros 
            if (isset($filters['start_date'])) {
                $query .= " AND date >= ?";
                $params[] = $filters['start_date'];
            }

            if (isset($filters['end_date'])) {
                $query .= " AND date <= ?";
                $params[] = $filters['end_date'];
            }

            if (isset($filters['provider_name'])) {
                $query .= " AND (person_name LIKE ? OR company_name LIKE ?)";
                $searchTerm = '%' . $filters['provider_name'] . '%';
                $params[] = $searchTerm;
                $params[] = $searchTerm;
            }

            if (isset($filters['transaction_id'])) {
                $query .= " AND transaction_id = ?";
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
            throw new Exception("Error al contar compras: " . $e->getMessage());
        }
    }

    public function getPurchaseDetailsById(int $transactionId) {
        try {
            // Obtener informacion basica de la transaccion desde la vista
            $transactionQuery = "
                SELECT 
                    transaction_id,
                    date,
                    tracking_number,
                    tax_type,
                    person_id,
                    person_name as provider_name,
                    company_name as provider_company,
                    email as provider_email,
                    phone as provider_phone,
                    transport_company,
                    transport_id,
                    total_items,
                    total_extras,
                    total_descuentos,
                    total_a_pagar,
                    total_pagado,
                    saldo_restante
                FROM view_compras_detalladas
                WHERE transaction_id = ?
            ";
            
            $stmt = $this->pdo->prepare($transactionQuery);
            $stmt->execute([$transactionId]);
            $transaction = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$transaction) {
                throw new Exception("Compra no encontrada con ID: $transactionId");
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

            // Usar los totales de la vista en lugar de calcularlos manualmente
            return [
                'transaction' => $transaction,
                'items' => $items,
                'extras' => $extras,
                'payments' => $payments,
                'totals' => [
                    'items' => $transaction['total_items'],
                    'extras' => $transaction['total_extras'],
                    'transaction' => $transaction['total_a_pagar'],
                    'paid' => $transaction['total_pagado'],
                    'pending' => $transaction['saldo_restante']
                ]
            ];
        } catch (PDOException $e) {
            throw new Exception("Error al obtener detalles de la compra: " . $e->getMessage());
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

    public function getAllPurchases() {
        try {
            $query = "SELECT * FROM view_compras_detalladas";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute();
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            return $rows;
        } catch (PDOException $e) {
            throw new Exception("Error al obtener todas las compras: " . $e->getMessage());
        }
    }
}
?>