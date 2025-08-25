<?php

namespace Services;

use Config\DataBase;
use Entities\Transaction;
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

    public function getTotalSales(){
        try{
            $stmt = $this->pdo->prepare("SELECT SUM(total_a_pagar) as TotalSales FROM view_ventas_detalladas");
            $stmt->execute();
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result['TotalSales'] ?? 0;
        
        }catch(PDOException $e){
            throw new Exception('Error fetching total sales: ' . $e->getMessage());
        }
    }

    public function getTotalPurchases(){
        try{
            $stmt = $this->pdo->prepare("SELECT SUM(total) as total_purchases FROM transaction WHERE type = 'purchase'");
            $stmt->execute();
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result['total_purchases'] ?? 0;
        }catch(PDOException $e){
            throw new Exception('Error fetching total purchases: ' . $e->getMessage());
        }
    }

    public function getRecentTransactions($limit = 10){
        try{
            $stmt = $this->pdo->prepare("SELECT company_name, date, total_a_pagar 
            FROM view_ventas_detalladas ORDER BY date DESC LIMIT ?");
            $stmt->bindParam(1, $limit, PDO::PARAM_INT);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        }catch(PDOException $e){
            throw new Exception('Error fetching recent transactions: ' . $e->getMessage());
        }
    }
}