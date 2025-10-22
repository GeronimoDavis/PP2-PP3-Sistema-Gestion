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

    public function getById($id){
        try{
            $stmt = $this->pdo->prepare("SELECT * FROM category WHERE category_id = ?");
            $stmt->execute([$id]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);

            if(!$row){
                throw new Exception("Category not found with ID: $id");
            }

            return new Category($row);
        }catch(PDOException $e){
            throw new Exception("Error fetching category by ID $id: " . $e->getMessage());
        }
    }

    public function getByName($name){
        try{
            $stmt = $this->pdo->prepare("SELECT * FROM category WHERE name = ? AND active = 1");
            $stmt->execute([$name]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);

            if(!$row){
                return null;
            }

            return new Category($row);
        }catch(PDOException $e){
            throw new Exception("Error fetching category by name '$name': " . $e->getMessage());
        }
    }

    public function create(Category $category){
        try{
            $stmt = $this->pdo->prepare("INSERT INTO category (name) VALUES (?)");
            $stmt->execute([$category->name]);

            $category->category_id = $this->pdo->lastInsertId();
            return $category;
        }catch(PDOException $e){
            throw new Exception('Error creating category: ' . $e->getMessage());
        }
    }

    public function update(Category $category){
        try{
            $stmt = $this->pdo->prepare("UPDATE category SET name = ? WHERE category_id = ?");
            $stmt->execute([$category->name, $category->category_id]);

            return $category;
        }catch(PDOException $e){
            throw new Exception('Error updating category: ' . $e->getMessage());
        }
    }
}
?>