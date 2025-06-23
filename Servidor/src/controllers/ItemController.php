<?php
namespace Controllers;
use Services\ItemService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class ItemController
{
    private ItemService $itemService;

    public function __construct()
    {
        $this->itemService = new ItemService();
    }
    public function getAllItems(Request $request, Response $response): Response
    {
        try {
            $items = $this->itemService->getAllItems();
            $response->getBody()->write(json_encode($items));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        } catch (\Exception $e) {
            $response->getBody()->write("Error fetching items: " . $e->getMessage());
            return $response->withStatus(500);
        }
    }
    public function getItemById(Request $request, Response $response, array $args): Response
    {
        try {
            $item = $this->itemService->getItemById($args['id']);
            if ($item) {
                $response->getBody()->write(json_encode($item));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
            } else {
                $response->getBody()->write("Item not found");
                return $response->withStatus(404);
            }
        } catch (\Exception $e) {
            $response->getBody()->write("Error fetching item: " . $e->getMessage());
            return $response->withStatus(500);
        }
    }
    public function createItem(Request $request, Response $response): Response
    {
        try {
            $data = json_decode($request->getBody()->getContents(), true);
            $item = new \Entities\Item($data);
            $createdItem = $this->itemService->createItem($item);
            $response->getBody()->write(json_encode($createdItem));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(201);
        } catch (\Exception $e) {
            $response->getBody()->write("Error creating item: " . $e->getMessage());
            return $response->withStatus(500);
        }
    }
    public function updateItem(Request $request, Response $response, array $args): Response
    {
        try {
            $data = json_decode($request->getBody()->getContents(), true);
            $item = new \Entities\Item($data);
            $item->item_id = $args['id']; 
            $updatedItem = $this->itemService->updateItem($item);
            if ($updatedItem) {
                $response->getBody()->write(json_encode($updatedItem));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
            } else {
                $response->getBody()->write("Item not found");
                return $response->withStatus(404);
            }
        } catch (\Exception $e) {
            $response->getBody()->write("Error updating item: " . $e->getMessage());
            return $response->withStatus(500);
        }
    }
    public function deleteItem(Request $request, Response $response, array $args): Response
    {
        try {
            $deleted = $this->itemService->deleteItem($args['id']);
            if ($deleted) {
                return $response->withStatus(204); 
            } else {
                $response->getBody()->write("Item not found");
                return $response->withStatus(404);
            }
        } catch (\Exception $e) {
            $response->getBody()->write("Error deleting item: " . $e->getMessage());
            return $response->withStatus(500);
        }
    }


}
