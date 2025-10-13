<?php

namespace Services;

use Config\DataBase;
use Entities\Transaction;
use Entities\Product;
use Exception;
use PDO;
use PDOException;

class DashboardService{
    private $pdo;

    public function __construct(){
        try{
            $this->pdo = DataBase::Connect();
        }catch(PDOException $e){
            throw new Exception('Database connection error: ' . $e->getMessage());
        }
    }

    public function getTotalSales($from, $to){
        try{
            $stmt = $this->pdo->prepare("SELECT SUM(total_a_pagar) as TotalSales FROM view_ventas_detalladas WHERE is_budget = 0 AND date BETWEEN ? AND ?");
            $stmt->execute([$from, $to]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result['TotalSales'] ?? 0;
        
        }catch(PDOException $e){
            throw new Exception('Error fetching total sales: ' . $e->getMessage());
        }
    }


public function getTotalPurchases($from, $to){
    try{
        $stmt = $this->pdo->prepare("SELECT SUM(total_a_pagar) as total_purchases FROM view_compras_detalladas WHERE date BETWEEN ? AND ?");
        $stmt->execute([$from, $to]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result['total_purchases'] ?? 0;
    }catch(PDOException $e){
        throw new Exception('Error fetching total purchases: ' . $e->getMessage());
    }
}

    public function getRecentTransactions($limit = 10, $from, $to){
        try{
            $stmt = $this->pdo->prepare("SELECT company_name, date, total_a_pagar 
            FROM view_ventas_detalladas WHERE is_budget = 0 AND date BETWEEN ? AND ? ORDER BY date DESC LIMIT ?");
            $stmt->bindParam(1, $from);
            $stmt->bindParam(2, $to);
            $stmt->bindParam(3, $limit, PDO::PARAM_INT);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        }catch(PDOException $e){
            throw new Exception('Error fetching recent transactions: ' . $e->getMessage());
        }
    }

    
    public function getProductsWithoutStock() {
        try {
            $query = "SELECT * FROM product WHERE stock = 0";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute();
            $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
            return array_map(fn($p) => new Product($p), $products);
        } catch (PDOException $e) {
            throw new Exception("Error fetching products without stock: " . $e->getMessage());
        }
    }

    public function getVentasConSaldoPendiente($from, $to)
    {
        $sql = "SELECT * FROM view_ventas_detalladas WHERE saldo_restante > 0 AND is_budget = 0 AND date BETWEEN ? AND ?";
        try {
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$from, $to]);
            $ventas = $stmt->fetchAll(PDO::FETCH_OBJ);
            return $ventas;
        } catch (PDOException $e) {
            throw new Exception('Error al obtener ventas con saldo pendiente: ' . $e->getMessage());
        }
    }

    public function getSalesSummary($from, $to)
    {
        try {
            $stmt = $this->pdo->prepare("
                SELECT 
                    DATE_FORMAT(date, '%Y-%m') as period_label, 
                    SUM(total_a_pagar) as total 
                FROM view_ventas_detalladas
                WHERE is_budget = 0 AND date BETWEEN ? AND ?
                GROUP BY period_label
                ORDER BY period_label;
            ");
            $stmt->execute([$from, $to]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw new Exception('Error fetching sales summary: ' . $e->getMessage());
        }
    }
}