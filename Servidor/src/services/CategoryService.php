<?php
namespace Services;
use Config\DataBase;
use Entities\Category;
use Exception;
use PDO;
use PDOException;

class CategoryService{
    private $pdo;

    public function __construct(){
        try{
            $this->pdo = DataBase::Connect();
        }catch(PDOException $e){
            throw new Exception('Database connection error: ' . $e->getMessage());
        }
    }

    public function getAll(){
        try{
            $stmt = $this->pdo->prepare("SELECT * FROM category ORDER BY name");
            $stmt->execute();
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $categories = [];
            foreach($rows as $row){
                $categories[] = new Category($row);
            }

            return $categories;
        }catch(PDOException $e){
            throw new Exception('Error fetching categories: ' . $e->getMessage());
        }


    }

    public function create(Category $category){
        try{
            $stmt = $this->pdo->prepare("INSERT INTO category (category_description) VALUES (?)");
            $stmt->execute([$category->category_description]);

            $category->category_id = $this->pdo->lastInsertId();
            return $category;
        }catch(PDOException $e){
            throw new Exception('Error creating category: ' . $e->getMessage());
        }
    }
}
?>