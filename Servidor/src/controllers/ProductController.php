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
    public function getProductByDescription(Request $request, Response $response, $args)
    {
        try {
            $description = $args['description'];
            $products = $this->productService->getByDescription($description);
            $productsArray = array_map(fn($p) => $p->toArray(), $products);
            $response->getBody()->write(json_encode(['products' => $productsArray]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        } catch (Throwable $e) {
            throw new Exception("Error fetching products by description: " . $e->getMessage());
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
            $products = $this->productService->getByPrice($price);
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
            $product = new Product($data);
            $createdProduct = $this->productService->create($product);
            $response->getBody()->write(json_encode(['product' => $createdProduct->toArray()]));
            $data = $request->getParsedBody();
            var_dump($data);
            die();
            return $response->withHeader('Content-Type', 'application/json')->withStatus(201);
        } catch (Throwable $e) {
            throw new Exception("Error creating person: " . $e->getMessage());
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


 
   

}

    
