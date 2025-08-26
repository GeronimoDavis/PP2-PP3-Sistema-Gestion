<?php

namespace Services;

use Config\DataBase;
use Exception;
use PDO;
use PDOException;

class ReportesService
{
    private $pdo;

    public function __construct()
    {
        try {
            $this->pdo = DataBase::Connect();
        } catch (PDOException $e) {
            throw new Exception('Database connection error: ' . $e->getMessage());
        }
    }

    public function getSalesOverview($startDate, $endDate)
    {
        try {
            $query = "
                SELECT
                    DATE(date) as sale_date,
                    SUM(total_a_pagar) as total_sales
                FROM
                    view_ventas_detalladas
                WHERE
                    DATE(date) BETWEEN :start_date AND :end_date
                GROUP BY
                    sale_date
                ORDER BY
                    sale_date ASC;
            ";

            $stmt = $this->pdo->prepare($query);
            $stmt->bindParam(':start_date', $startDate);
            $stmt->bindParam(':end_date', $endDate);
            $stmt->execute();

            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw new Exception("Error fetching sales overview: " . $e->getMessage());
        }
    }

    public function getSalesByCategory($startDate, $endDate)
    {
        try {
            $query = "
                SELECT
                    category_name,
                    SUM(item_total) as total_sales
                FROM
                    view_ventas_productos_categorias
                WHERE
                    DATE(transaction_date) BETWEEN :start_date AND :end_date
                GROUP BY
                    category_name
                ORDER BY
                    total_sales DESC;
            ";

            $stmt = $this->pdo->prepare($query);
            $stmt->bindParam(':start_date', $startDate);
            $stmt->bindParam(':end_date', $endDate);
            $stmt->execute();

            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw new Exception("Error fetching sales by category: " . $e->getMessage());
        }
    }

    public function getTopSellingProducts($startDate, $endDate)
    {
        try {
            $query = "
                SELECT
                    product_name,
                    SUM(quantity) as total_quantity_sold,
                    SUM(item_total) as total_sales
                FROM
                    view_ventas_productos_categorias
                WHERE
                    DATE(transaction_date) BETWEEN :start_date AND :end_date
                GROUP BY
                    product_name
                ORDER BY
                    total_quantity_sold DESC
                LIMIT 5;
            ";

            $stmt = $this->pdo->prepare($query);
            $stmt->bindParam(':start_date', $startDate);
            $stmt->bindParam(':end_date', $endDate);
            $stmt->execute();

            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw new Exception("Error fetching top selling products: " . $e->getMessage());
        }
    }

    public function getSalesTrendsByCategory($startDate, $endDate, $interval = 'monthly')
    {
        try {
            $dateFormat = '';
            switch ($interval) {
                case 'daily':
                    $dateFormat = '%Y-%m-%d';
                    break;
                case 'weekly':
                    $dateFormat = '%Y-%u'; // Year and week number
                    break;
                case 'monthly':
                    $dateFormat = '%Y-%m';
                    break;
                case 'annual':
                    $dateFormat = '%Y';
                    break;
                default:
                    $dateFormat = '%Y-%m'; // Default to monthly
                    break;
            }

            $query = "
                SELECT
                    DATE_FORMAT(transaction_date, '{$dateFormat}') as period,
                    category_name,
                    SUM(item_total) as total_sales
                FROM
                    view_ventas_productos_categorias
                WHERE
                    DATE(transaction_date) BETWEEN :start_date AND :end_date
                GROUP BY
                    period, category_name
                ORDER BY
                    period ASC, category_name ASC;
            ";

            $stmt = $this->pdo->prepare($query);
            $stmt->bindParam(':start_date', $startDate);
            $stmt->bindParam(':end_date', $endDate);
            $stmt->execute();

            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw new Exception("Error fetching sales trends by category: " . $e->getMessage());
        }
    }
}