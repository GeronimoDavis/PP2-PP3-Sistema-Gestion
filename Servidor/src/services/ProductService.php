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
    public function getByCode($code)
    {
        try {
            $query = "SELECT * FROM product WHERE code = ?";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([$code]);
            $product = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$product) {
                throw new Exception("Product not found with code: $code");
            }

            return new Product($product);
        } catch (PDOException $e) {
            throw new Exception("Error fetching product by code $code: " . $e->getMessage());
        }
    }

    public function getByDescription($description)
    {
        try {
            $query = "SELECT * FROM product WHERE description LIKE ?";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute(['%' . $description . '%']);
            $products = $stmt->fetchAll(PDO::FETCH_ASSOC);

            if (!$products) {
                throw new Exception("No products found with description: $description");
            }

            return array_map(fn($p) => new Product($p), $products);
        } catch (PDOException $e) {
            throw new Exception("Error fetching products by description: " . $e->getMessage());
        }
    }
    public function getByCategory($category_id)
    {
        try {
            $query = "SELECT * FROM product WHERE category_id = ?";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([$category_id]);
            $products = $stmt->fetchAll(PDO::FETCH_ASSOC);

            if (!$products) {
                throw new Exception("No products found for category ID: $category_id");
            }

            return array_map(fn($p) => new Product($p), $products);
        } catch (PDOException $e) {
            throw new Exception("Error fetching products by category ID: " . $e->getMessage());
        }
    }
    public function getByStock($stock)
    {
        try {
            $query = "SELECT * FROM product WHERE stock = ?";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([$stock]);
            $products = $stmt->fetchAll(PDO::FETCH_ASSOC);

            if (!$products) {
                throw new Exception("No products found with stock: $stock");
            }

            return array_map(fn($p) => new Product($p), $products);
        } catch (PDOException $e) {
            throw new Exception("Error fetching products by stock: " . $e->getMessage());
        }
    }
    public function getByPurchasePrice($purchase_price)
    {
        try {
            $query = "SELECT * FROM product WHERE purchase_price = ?";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([$purchase_price]);
            $products = $stmt->fetchAll(PDO::FETCH_ASSOC);

            if (!$products) {
                throw new Exception("No products found with purchase price: $purchase_price");
            }

            return array_map(fn($p) => new Product($p), $products);
        } catch (PDOException $e) {
            throw new Exception("Error fetching products by purchase price: " . $e->getMessage());
        }
    }

    public function getByPriceRange($minPrice, $maxPrice)
    {
        try {
            $query = "SELECT * FROM product WHERE purchase_price BETWEEN ? AND ?";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([$minPrice, $maxPrice]);
            $products = $stmt->fetchAll(PDO::FETCH_ASSOC);

            if (!$products) {
                throw new Exception("No products found in the price range: $minPrice - $maxPrice");
            }

            return array_map(fn($p) => new Product($p), $products);
        } catch (PDOException $e) {
            throw new Exception("Error fetching products by price range: " . $e->getMessage());
        }
    }

    public function getByStockRange($minStock, $maxStock)
    {
        try {
            $query = "SELECT * FROM product WHERE stock BETWEEN ? AND ?";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([$minStock, $maxStock]);
            $products = $stmt->fetchAll(PDO::FETCH_ASSOC);

            if (!$products) {
                throw new Exception("No products found in the stock range: $minStock - $maxStock");
            }

            return array_map(fn($p) => new Product($p), $products);
        } catch (PDOException $e) {
            throw new Exception("Error fetching products by stock range: " . $e->getMessage());
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
    public function delete($id)
    {
        try {
            $stmt = $this->pdo->prepare("DELETE FROM product WHERE product_id = ?");
            $stmt->execute([$id]);
            if ($stmt->rowCount() === 0) {
                throw new Exception("No product found with ID: $id");
            }
        } catch (PDOException $e) {
            throw new Exception("Error deleting product: " . $e->getMessage());
        }
    }
  




    
}















