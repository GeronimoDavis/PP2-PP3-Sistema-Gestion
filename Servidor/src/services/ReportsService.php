<?php

namespace Services;

use Config\DataBase;
use Exception;
use PDO;
use PDOException;

class ReportsService
{
    protected $db;

    public function __construct()
    {
        try {
            $this->db = DataBase::Connect();
        } catch (PDOException $e) {
            throw new Exception('Database connection error: ' . $e->getMessage());
        }
    }

    public function getSalesByPeriod($from, $to, $period)
    {
        $dateFormat = match ($period) {
            'daily' => '%Y-%m-%d',
            'weekly' => '%Y-%u',
            'monthly' => '%Y-%m',
            'annual' => '%Y',
            default => '%Y-%m-%d',
        };

        $stmt = $this->db->prepare("
            SELECT 
                DATE_FORMAT(t.date, :dateFormat) as period_label, 
                SUM(i.quantity * i.price) as total 
            FROM transaction t
            JOIN items i ON t.transaction_id = i.transaction_id
            WHERE t.is_sale = 1 AND t.date BETWEEN :from AND :to
            GROUP BY period_label
            ORDER BY period_label;
        ");

        $stmt->execute([':dateFormat' => $dateFormat, ':from' => $from, ':to' => $to]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getSalesByCategory($from, $to)
    {
        $stmt = $this->db->prepare("
            SELECT 
                c.name,
                SUM(i.quantity * i.price) as value
            FROM transaction t
            JOIN items i ON t.transaction_id = i.transaction_id
            JOIN product p ON i.product_id = p.product_id
            JOIN category c ON p.category_id = c.category_id
            WHERE t.is_sale = 1 AND t.date BETWEEN :from AND :to
            GROUP BY c.name;
        ");
        $stmt->execute([':from' => $from, ':to' => $to]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getTopSellingProducts($from, $to, $limit = 5)
    {
        $stmt = $this->db->prepare("
            SELECT 
                p.name,
                SUM(i.quantity) as total_quantity,
                SUM(i.quantity * i.price) as total_sales
            FROM transaction t
            JOIN items i ON t.transaction_id = i.transaction_id
            JOIN product p ON i.product_id = p.product_id
            WHERE t.is_sale = 1 AND t.date BETWEEN :from AND :to
            GROUP BY p.name
            ORDER BY total_sales DESC
            LIMIT :limit;
        ");
        $stmt->bindValue(':from', $from);
        $stmt->bindValue(':to', $to);
        $stmt->bindValue(':limit', (int) $limit, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getSalesTrendsByCategory($from, $to)
    {
        $stmt = $this->db->prepare("
            SELECT 
                DATE_FORMAT(t.date, '%Y-%m') as name,
                c.name as category_name,
                SUM(i.quantity * i.price) as total
            FROM transaction t
            JOIN items i ON t.transaction_id = i.transaction_id
            JOIN product p ON i.product_id = p.product_id
            JOIN category c ON p.category_id = c.category_id
            WHERE t.is_sale = 1 AND t.date BETWEEN :from AND :to
            GROUP BY name, category_name
            ORDER BY name, category_name;
        ");
        $stmt->execute([':from' => $from, ':to' => $to]);
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Pivot data for line chart
        $trends = [];
        foreach ($results as $row) {
            $month = $row['name'];
            $category = $row['category_name'];
            $total = $row['total'];

            if (!isset($trends[$month])) {
                $trends[$month] = ['name' => $month];
            }
            $trends[$month][$category] = $total;
        }

        return array_values($trends);
    }
}

