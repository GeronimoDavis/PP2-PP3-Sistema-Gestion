<?php
namespace Services;
use Config\DataBase;
use Entities\TransportCompany;
use Exception;
use PDO;
use PDOException;

class TransportCompanyService {
    private $pdo;

    public function __construct() {
        $this->pdo = DataBase::Connect();
    }

    public function getAll() {
        try {
            $query = "SELECT * FROM transport_companies ORDER BY company_id";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute();
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $companies = [];
            foreach ($rows as $row) {
                $companies[] = new TransportCompany($row['company_id'], $row['name'], $row['url']);
            }
            return $companies;
        } catch (PDOException $e) {
            throw new Exception("Error fetching all transport companies: " . $e->getMessage());
        }
    }
    public function createCompany(TransportCompany $data) {
        try {
            $query = "INSERT INTO transport_companies (name, url) VALUES (?, ?)";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([
                $data->name,
                $data->url
            ]);
            $data->company_id = $this->pdo->lastInsertId();
           
            return true;
        } catch (PDOException $e) {
            throw new Exception("Error creating transport company: " . $e->getMessage());
        }
    }
    public function delete($company_id) {
        try {
            $query = "DELETE FROM transport_companies WHERE company_id = :company_id";
            $stmt = $this->pdo->prepare($query);
            $stmt->bindParam(':company_id', $company_id);
            $stmt->execute();   
            return true;
        } catch (PDOException $e) {    
            throw new Exception("Error deleting transport company: " . $e->getMessage());
        }
    }
    public function update(TransportCompany $data) {
        try {
            $query = "UPDATE transport_companies SET name = ?, url = ? WHERE company_id = ?";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([
                $data->name,
                $data->url,
                $data->company_id
            ]);
            return true;
        } catch (PDOException $e) {
            throw new Exception("Error updating transport company: " . $e->getMessage());
        }
    }
}