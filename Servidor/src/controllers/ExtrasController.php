<?php
namespace Controllers;
use Services\ExtrasService;
use Entities\Extras;
use Entities\ExtrasType;
use Exception;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Message\ResponseInterface as Response;
class ExtrasController
{
    private $extrasService;

    public function __construct()
    {
     try{
        $this->extrasService = new ExtrasService();
     }catch(Exception $e){
        throw new Exception("Error creating the extras service: " . $e->getMessage());
     }
    }

    public function getAllExtras(Request $request, Response $response): Response
    {
        try {
            $extras = $this->extrasService->getAll();
            $response->getBody()->write(json_encode($extras));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        } catch (Exception $e) {
            $response->getBody()->write("Error fetching extras: " . $e->getMessage());
            return $response->withStatus(500);
        }
    }
    public function getExtraById(Request $request, Response $response, array $args): Response
    {
        try {
            $extra = $this->extrasService->getById($args['id']);
            if ($extra) {
                $response->getBody()->write(json_encode($extra));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
            } else {
                $response->getBody()->write("Extra not found");
                return $response->withStatus(404);
            }
        } catch (Exception $e) {
            $response->getBody()->write("Error fetching extra: " . $e->getMessage());
            return $response->withStatus(500);
        }
    }
    public function createExtra(Request $request, Response $response): Response
    {
        try {
            $data = json_decode($request->getBody()->getContents(), true);
            $extra = new Extras(
                0, 
                $data['transaction_id'],
                (float)$data['price'],
                $data['note'],
                ExtrasType::from($data['type'])
            );
            $createdExtra = $this->extrasService->create($extra);
            $response->getBody()->write(json_encode($createdExtra));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(201);
        } catch (Exception $e) {
            $response->getBody()->write("Error creating extra: " . $e->getMessage());
            return $response->withStatus(500);
        }
    }
    public function updateExtra(Request $request, Response $response, array $args): Response
    {
        try {
            $data = json_decode($request->getBody()->getContents(), true);
            $extra = new Extras(
                (int)$args['id'], 
                $data['transaction_id'],
                (float)$data['price'],
                $data['note'],
                ExtrasType::from($data['type'])
            );
            $updatedExtra = $this->extrasService->update($extra);
            if ($updatedExtra) {
                $response->getBody()->write(json_encode($updatedExtra));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
            } else {
                $response->getBody()->write("Extra not found");
                return $response->withStatus(404);
            }
        } catch (Exception $e) {
            $response->getBody()->write("Error updating extra: " . $e->getMessage());
            return $response->withStatus(500);
        }
    }
    public function deleteExtra(Request $request, Response $response, array $args): Response
    {
        try {
            $deleted = $this->extrasService->delete($args['id']);
            if ($deleted) {
                return $response->withStatus(204); // No Content
            } else {
                $response->getBody()->write("Extra not found");
                return $response->withStatus(404);
            }
        } catch (Exception $e) {
            $response->getBody()->write("Error deleting extra: " . $e->getMessage());
            return $response->withStatus(500);
        }
    }

}