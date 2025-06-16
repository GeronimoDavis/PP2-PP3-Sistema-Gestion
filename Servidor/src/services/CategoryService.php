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
            $stmt = $this->pdo->prepare("SELECT * FROM category ORDER BY description");
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

    public function getByDescription($description){
        try{
            $stmt = $this->pdo->prepare("SELECT * FROM category WHERE description = ?");
            $stmt->execute([$description]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);

            if(!$row){
                throw new Exception("Category not found with description: $description");
            }

            return new Category($row);
        }catch(PDOException $e){
            throw new Exception("Error fetching category by description $description: " . $e->getMessage());
        }
    }

    public function create(Category $category){
        try{
            $stmt = $this->pdo->prepare("INSERT INTO category (description) VALUES (?)");
            $stmt->execute([$category->description]);

            $category->category_id = $this->pdo->lastInsertId();
            return $category;
        }catch(PDOException $e){
            throw new Exception('Error creating category: ' . $e->getMessage());
        }
    }

    public function update(Category $category){
        try{
            $stmt = $this->pdo->prepare("UPDATE category SET description = ? WHERE category_id = ?");
            $stmt->execute([$category->description, $category->category_id]);

            return $category;
        }catch(PDOException $e){
            throw new Exception('Error updating category: ' . $e->getMessage());
        }
    }
}
?>