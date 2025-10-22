<?php
namespace Controllers;
use Services\ProductService;
use Entities\Product;   
use Throwable;
use Exception;
use FastRoute\Route;
use PDOException;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Message\ResponseInterface as Response;


class ProductController 
{
    private ProductService $productService;

    public function __construct()
    {
        $this->productService = new ProductService();
    }
    public function getAllProducts(Request $request, Response $response): Response
    {
        try {
            $products = $this->productService->getAll();
            $productsArray = array_map(fn($p) => $p->toArray(), $products);
            $response->getBody()->write(json_encode(['products' => $productsArray]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
            
        } catch (Throwable $e) {
            throw new Exception("Error fetching all products: " . $e->getMessage());
        }
    }
    public function getProductById(Request $request, Response $response, $args)
    {
        try {
            $id = $args['id'];
            $products =$this->productService->getById($id);
            $response->getBody()->write(json_encode(['products'=> $products]));
            return $response->withHeader('contentipe', 'application/json')->withStatus(200);

        } catch (Throwable $e) {
            throw new Exception("Error fetching product by ID: " . $e->getMessage());
        }
    }
    public function getProductByCode(Request $request, Response $response, $args)
    {
        try {
            $code = $args['code'];
            $product = $this->productService->getByCode($code);
            $response->getBody()->write(json_encode(['product' => $product->toArray()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        } catch (Throwable $e) {
            throw new Exception("Error fetching product by code: " . $e->getMessage());
        }
    }
    public function getProductByName(Request $request, Response $response, $args)
    {
        try {
            $name = $args['name'];
            $products = $this->productService->getByName($name);
            $productsArray = array_map(fn($p) => $p->toArray(), $products);
            $response->getBody()->write(json_encode(['products' => $productsArray]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        } catch (Throwable $e) {
            throw new Exception("Error fetching products by name: " . $e->getMessage());
        }
    }
    public function getProductByCategory(Request $request, Response $response, $args)
    {
        try {
            $categoryId = $args['category_id'];
            $products = $this->productService->getByCategory($categoryId);
            $productsArray = array_map(fn($p) => $p->toArray(), $products);
            $response->getBody()->write(json_encode(['products' => $productsArray]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        } catch (Throwable $e) {
            throw new Exception("Error fetching products by category: " . $e->getMessage());
        }
    }
    public function getProductByStock(Request $request, Response $response, $args)
    {
        try {
            $stock = $args['stock'];
            $products = $this->productService->getByStock($stock);
            $productsArray = array_map(fn($p) => $p->toArray(), $products);
            $response->getBody()->write(json_encode(['products' => $productsArray]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        } catch (Throwable $e) {
            throw new Exception("Error fetching products by stock: " . $e->getMessage());
        }
    }
    public function getProductByPrice(Request $request, Response $response, $args)
    {
        try {
            $price = $args['price'];
            $products = $this->productService->getByPurchasePrice($price);
            $productsArray = array_map(fn($p) => $p->toArray(), $products);
            $response->getBody()->write(json_encode(['products' => $productsArray]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        } catch (Throwable $e) {
            throw new Exception("Error fetching products by price: " . $e->getMessage());
        }
    }
    public function getProductByPriceRange(Request $request, Response $response, $args)
    {
        try {
            $min = $args['min'];
            $max = $args['max'];
            $products = $this->productService->getByPriceRange($min, $max);
            $productsArray = array_map(fn($p) => $p->toArray(), $products);
            $response->getBody()->write(json_encode(['products' => $productsArray]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        } catch (Throwable $e) {
            throw new Exception("Error fetching products by price range: " . $e->getMessage());
        }
    }
    public function getProductBystockRange(Request $request, Response $response, $args)
    {
        try {
            $min = $args['min'];
            $max = $args['max'];
            $products = $this->productService->getByStockRange($min, $max);
            $productsArray = array_map(fn($p) => $p->toArray(), $products);
            $response->getBody()->write(json_encode(['products' => $productsArray]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        } catch (Throwable $e) {
            throw new Exception("Error fetching products by stock range: " . $e->getMessage());
        }
    }

   public function createProduct(Request $request, Response $response, $args)
   {   
           try {
            $data = $request->getParsedBody();

            //validaciones
            if (!isset($data['code'], $data['name'], $data['category_id'], $data['stock'], $data['purchase_price'], $data['sell_price'], $data['stock_minimum'])) {
                throw new Exception("Missing required fields.");
            }

            
            $product = new Product($data);
            $createdProduct = $this->productService->create($product);
            $response->getBody()->write(json_encode(['product' => $createdProduct->toArray()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(201);
        } catch (Throwable $e) {
            throw new Exception("Error creating product: " . $e->getMessage());
        }
    
   }
   public function updateProduct(Request $request, Response $response, $args){
     try {
    $id = $args ['id'];
    $data = $request->getParsedBody();
    $product = new Product($data);
    $product->product_id = $id;
    $this->productService->update($product);
    $response->getBody()->write(json_encode(['message' => 'Product update suseccfully']));
    return $response->withHeader("content-type", 'application/json')->withStatus(200);


     } catch (PDOException $e) {
    throw new Exception("Error updating product: " . $e->getMessage());
     }

   }
   public function deleteProduct(Request $request, Response $response, $args)
   {
       try {
           $id = $args['id'];
           $this->productService->delete($id);
           $response->getBody()->write(json_encode(['message' => 'Product deleted successfully']));
           return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
       } catch (Throwable $e) {
           throw new Exception("Error deleting product: " . $e->getMessage());
       }
   }
       public function updateProductStatus(Request $request, Response $response, $args)
    {
     try {
         $id = $args['id'];
         $this->productService->updateStatus($id);
         $response->getBody()->write(json_encode(['message' => 'Product status updated successfully']));
         return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
     } catch (Throwable $e) {
         throw new Exception("Error updating product status: " . $e->getMessage());
     }
    }

    public function updateProductStock(Request $request, Response $response, $args)
    {
        try {
            $data = $request->getParsedBody();
            $productId = $args['id'];
            $quantity = $data['quantity'] ?? 0;

            if ($quantity <= 0) {
                throw new Exception("La cantidad debe ser mayor a 0");
            }

            $this->productService->updateStock($productId, $quantity);
            $response->getBody()->write(json_encode(['message' => 'Product stock updated successfully']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        } catch (Throwable $e) {
            throw new Exception("Error updating product stock: " . $e->getMessage());
        }
    }

    public function updateProductStockForPurchase(Request $request, Response $response, $args)
    {
        try {
            $data = $request->getParsedBody();
            $productId = $args['id'];
            $quantity = $data['quantity'] ?? 0;

            if ($quantity <= 0) {
                throw new Exception("La cantidad debe ser mayor a 0");
            }

            $this->productService->updateStockForPurchase($productId, $quantity);
            $response->getBody()->write(json_encode(['message' => 'Product stock updated for purchase successfully']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        } catch (Throwable $e) {
            throw new Exception("Error updating product stock for purchase: " . $e->getMessage());
        }
    }

   
    public function getAllDeletedProducts(Request $request, Response $response): Response
    {
        try {
            $products = $this->productService->getAllDeleted();
            $productsArray = array_map(fn($p) => $p->toArray(), $products);
            $response->getBody()->write(json_encode(['products' => $productsArray]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        } catch (Throwable $e) {
            throw new Exception("Error fetching deleted products: " . $e->getMessage());
        }
    }

  
    public function restoreProduct(Request $request, Response $response, $args): Response
    {
        try {
            $id = $args['id'];
            $this->productService->restore($id);
            $response->getBody()->write(json_encode(['message' => 'Product restored successfully']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        } catch (Throwable $e) {
            throw new Exception("Error restoring product: " . $e->getMessage());
        }
    }

    public function exportProductsToExcel(Request $request, Response $response): Response
    {
        try {
            $products = $this->productService->getAll();
            
            // Crear datos para Excel
            $excelData = [];
            $excelData[] = [
                'Código',
                'Nombre', 
                'Categoría',
                'Stock',
                'Precio Compra',
                'Precio Venta',
                'Stock Mínimo',
                'Estado'
            ];
            
            foreach ($products as $product) {
                $excelData[] = [
                    $product->code,
                    $product->name,
                    $product->category_name ?? '',
                    $product->stock,
                    $product->purchase_price,
                    $product->sell_price ?? '',
                    $product->stock_minimum ?? 5,
                    $product->active ? 'Activo' : 'Inactivo'
                ];
            }
            
            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $excelData,
                'message' => 'Datos preparados para exportar'
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
            
        } catch (Throwable $e) {
            throw new Exception("Error exporting products to Excel: " . $e->getMessage());
        }
    }

    public function importProductsFromExcel(Request $request, Response $response): Response
    {
        try {
            $data = $request->getParsedBody();
            
            if (!isset($data['products']) || !is_array($data['products'])) {
                throw new Exception("Datos de productos no válidos");
            }
            
            $importedCount = 0;
            $errors = [];
            
            foreach ($data['products'] as $index => $productData) {
                try {
                    // Validar datos requeridos
                    if (empty($productData['code']) || empty($productData['name'])) {
                        $errors[] = "Fila " . ($index + 1) . ": Código y nombre son obligatorios";
                        continue;
                    }
                    
                    // Verificar si el producto ya existe
                    $existingProduct = $this->productService->getByCode($productData['code']);
                    if ($existingProduct) {
                        $errors[] = "Fila " . ($index + 1) . ": El código '{$productData['code']}' ya existe";
                        continue;
                    }
                    
                    // Buscar o crear categoría "Genérica" si no se especifica
                    $categoryId = null;
                    if (isset($productData['category']) && $productData['category'] && $productData['category'] !== 'Genérica') {
                        // Buscar categoría existente por nombre
                        $categoryService = new \Services\CategoryService();
                        $existingCategory = $categoryService->getByName($productData['category']);
                        if ($existingCategory) {
                            $categoryId = $existingCategory->category_id;
                        }
                    }
                    
                    // Si no se encontró categoría o es "Genérica", buscar/crear "Genérica"
                    if (!$categoryId) {
                        $categoryService = new \Services\CategoryService();
                        $genericCategory = $categoryService->getByName('Genérica');
                        if (!$genericCategory) {
                            // Crear categoría "Genérica" si no existe
                            $genericCategory = $categoryService->create(new \Entities\Category(['name' => 'Genérica']));
                        }
                        $categoryId = $genericCategory->category_id;
                    }
                    
                    // Crear el producto
                    $product = new Product([
                        'code' => $productData['code'],
                        'name' => $productData['name'],
                        'category_id' => $categoryId,
                        'stock' => $productData['stock'] ?? 0,
                        'purchase_price' => $productData['purchase_price'] ?? 0,
                        'sell_price' => $productData['sell_price'] ?? null,
                        'stock_minimum' => $productData['stock_minimum'] ?? 5,
                        'active' => $productData['active'] ?? true
                    ]);
                    
                    $this->productService->create($product);
                    $importedCount++;
                    
                } catch (Exception $e) {
                    $errors[] = "Fila " . ($index + 1) . ": " . $e->getMessage();
                }
            }
            
            $response->getBody()->write(json_encode([
                'success' => true,
                'imported_count' => $importedCount,
                'errors' => $errors,
                'message' => "Se importaron {$importedCount} productos exitosamente"
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
            
        } catch (Throwable $e) {
            throw new Exception("Error importing products from Excel: " . $e->getMessage());
        }
    }

}

    
