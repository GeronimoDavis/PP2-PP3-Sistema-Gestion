<?php
namespace Controllers;
use Services\ProductService;
use Entities\Product;   
use Throwable;
use Exception;
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

 
   

}

    
