<?php
namespace Services;
use Config\DataBase;
use Entities\Product;
use Exception;
use PDO;
use PDOException;

class ProductService{
    private $pdo;

    public function __construct()
    {
        $this->pdo = DataBase::Connect();

    }
    public function getAll()
    {
        try{
       
         $query = "SELECT * FROM product ORDER BY product_id";
        $stmt = $this->pdo->prepare($query);
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $products = [];
            foreach ($rows as $row) {
               $products[] = new Product($row);
            }
        return $products;
        }catch(PDOException $e){
            throw new Exception("Error fetching all products: " . $e->getMessage());
        }

    }
    public function getById($id)
    {
        try {
            $query = "SELECT * FROM product WHERE product_id = ?";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([$id]);
            $product = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$product) {
                throw new Exception("Product not found with ID: $id");
            }

            return new Product($product);
        } catch (PDOException $e) {
            throw new Exception("Error fetching product by ID $id: " . $e->getMessage());
        }
    }
    public function create(Product $product){
        try {
            $stmt = $this->pdo->prepare("INSERT INTO product (description, code, stock, purchase_price, category_id) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([
                $product->description,
                $product->code,
                $product->stock,
                $product->purchase_price,
                $product->category_id

            ]);
            $product->product_id = $this->pdo->lastInsertId();
            return $product;
        } catch (\Throwable $e) {
            throw new Exception("Error creating product: " . $e->getMessage());
        }


    }
    public function update(Product $product)
    {
        try {
            $stmt = $this->pdo->prepare("UPDATE product SET description = ?, code = ?, stock = ?, purchase_price = ?, category_id = ? WHERE product_id = ?");
            $stmt->execute([
                $product->description,
                $product->code,
                $product->stock,
                $product->purchase_price,
                $product->category_id,
                $product->product_id
            ]);
            return $product;

        } catch (PDOException $e) {
          
           throw new Exception("Error preparing update product: " . $e->getMessage());
        }
    }



    
}















