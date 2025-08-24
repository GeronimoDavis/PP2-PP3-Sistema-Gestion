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
       
         $query = "SELECT * FROM product WHERE active = 1 ORDER BY product_id";
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
            $query = "SELECT * FROM product WHERE code = ? AND active = 1";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([$code]);
            $product = $stmt->fetch(PDO::FETCH_ASSOC);

            // Retornar null si no encuentra el producto, no lanzar excepción
            return $product ? new Product($product) : null;
        } catch (PDOException $e) {
            throw new Exception("Error fetching product by code $code: " . $e->getMessage());
        }
    }

    public function getByName($name)
    {
        try {
            $query = "SELECT * FROM product WHERE (name LIKE ? OR code LIKE ?) AND active = 1";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute(['%' . $name . '%', '%' . $name . '%']);
            $products = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Retornar array vacío si no hay productos, no lanzar excepción
            return array_map(fn($p) => new Product($p), $products);
        } catch (PDOException $e) {
            throw new Exception("Error fetching products by name: " . $e->getMessage());
        }
    }
    public function getByCategory($category_id)
    {
        try {
            $query = "SELECT * FROM product WHERE category_id = ? AND active = 1";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([$category_id]);
            $products = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Retornar array vacío si no hay productos, no lanzar excepción
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
            $stmt = $this->pdo->prepare("INSERT INTO product (name, code, stock, purchase_price, sell_price, category_id, active) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $product->name,
                $product->code,
                $product->stock,
                $product->purchase_price,
                $product->sell_price,
                $product->category_id,
                1 // active por defecto para que se muestre en el frontend cuando se crea un producto

            ]);
            $product->product_id = $this->pdo->lastInsertId();
            $product->active = 1;
            return $product;
        } catch (\Throwable $e) {
            throw new Exception("Error creating product: " . $e->getMessage());
        }


    }
    public function update(Product $product)
    {
        try {
            $stmt = $this->pdo->prepare("UPDATE product SET name = ?, code = ?, stock = ?, purchase_price = ?, sell_price = ?, category_id = ? WHERE product_id = ?");
            $stmt->execute([
                $product->name,
                $product->code,
                $product->stock,
                $product->purchase_price,
                $product->sell_price,
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
    public function updateStatus($id)
    {
        try {
            $stmt = $this->pdo->prepare("UPDATE product SET active = 0 WHERE product_id = ? AND active = 1");
            $stmt->execute([$id]);
        } catch (PDOException $e) {
            throw new Exception("Error updating product status: " . $e->getMessage());
        }

    }

    public function updateStock($productId, $quantity)
    {
        try {
            $stmt = $this->pdo->prepare("UPDATE product SET stock = stock - ? WHERE product_id = ? AND stock >= ?");
            $stmt->execute([$quantity, $productId, $quantity]);
            
            if ($stmt->rowCount() === 0) {
                throw new Exception("No hay suficiente stock disponible para el producto ID: $productId");
            }
            
            return true;
        } catch (PDOException $e) {
            throw new Exception("Error updating product stock: " . $e->getMessage());
        }
    }
  




    
}















