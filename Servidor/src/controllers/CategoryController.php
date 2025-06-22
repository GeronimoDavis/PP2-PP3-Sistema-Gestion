<?php

namespace Controllers;

use Services\CategoryService;
use Entities\Category;
use Throwable;
use Exception;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Message\ResponseInterface as Response;

class CategoryController{

    public function __construct()
    {
        $this->categoryService = new CategoryService();
    }

    public function getAllcategories(Request $request, Response $response, $args){
        try{
            $categories = $this->categoryService->getAll();
            $categoriesArray = array_map(fn($c) => $c->toArray(), $categories);
            $response->getBody()->write(json_encode(['categories' => $categoriesArray]));
            return $response->withHeader('Content-Type', 'application/json');
        }catch(Throwable $e){
           throw new Exception("Error fetching all categories: " . $e->getMessage());
        }
    }

    public function getCategoryById(Request $request, Response $response, $args)
    {
        try {
            $id = $args['id'] ?? null;
            $category = $this->categoryService->getById($id);
            $response->getBody()->write(json_encode(["category" => $category->toArray()]));
            return $response->withHeader('Content-Type', 'application/json');
        }catch(Throwable $e){
           throw new Exception("Error fetching category by ID $id: " . $e->getMessage());
       }
    }

    public function createCategory(Request $request, Response $response, $args){
        try{
            $data = $request->getParsedBody();
            $category = new Category($data);
            $createdCategory = $this->categoryService->create($category);
            $response->getBody()->write(json_encode(["category" => $createdCategory->toArray()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(201);
        }catch(Throwable $e){
            throw new Exception("Error creating category: " . $e->getMessage());
        }
    }

    public function updateCategory(Request $request, Response $response, $args){
        try{
            $id = $args['id'];
            $data = $request->getParsedBody();
            $category = new Category($data);
            $category->category_id = $id;
            $updateCategory = $this->categoryService->update($category);
            $response->getBody()->write(json_encode(["category" => $updateCategory->toArray()]));
            return $response->withHeader('Content-Type', 'application/json');
        }catch(Throwable $e){
            throw new Exception("Error updating category: " . $e->getMessage());
        }
    }
}

?>