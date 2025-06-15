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
}

?>