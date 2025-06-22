<?php
namespace Controllers;
use Services\TransportCompanyService;
use Entities\TransportCompany;
use Throwable;
use Exception;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Message\ResponseInterface as Response;

class TransportCompanyController {
    private TransportCompanyService $transportCompanyService;

    public function __construct() {
        $this->transportCompanyService = new TransportCompanyService();
    }

    public function getAllTransportCompanies(Request $request, Response $response, $args) {
        try {
            $companies = $this->transportCompanyService->getAll();
            $companiesArray = array_map(fn($c) => ['company_id' => $c->company_id,'name' => $c->name,'url' => $c->url], $companies);
            $response->getBody()->write(json_encode(['transport_companies' => $companiesArray]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        } catch (Throwable $e) {
            throw new Exception("Error fetching all transport companies: " . $e->getMessage());
        }
    }
    public function createTransportCompany(Request $request, Response $response, $args) {
        try {
            $data = $request->getParsedBody();
            if (!isset($data['name']) || !isset($data['url'])) {
                echo "Invalid input data. 'name' and 'url' are required.";
                return $response->withStatus(400);
            }
            $company = new TransportCompany($data);
            $this->transportCompanyService->createCompany($company);
            echo "Transport company created successfully with ID: " . $company->company_id;
            return $response->withStatus(201);
        } catch (Throwable $e) {
            throw new Exception("Error creating transport company: " . $e->getMessage());
        }
    }
    public function deleteTransportCompany(Request $request, Response $response, $args) {
        try {
            $company_id = $args['id'];
            if (!isset($company_id)) {
                echo "Invalid input data. 'id' is required.";
                return $response->withStatus(400);
            }
            $this->transportCompanyService->delete($company_id);
            echo "Transport company deleted successfully.";
            return $response->withStatus(200);
        } catch (Throwable $e) {
            throw new Exception("Error deleting transport company: " . $e->getMessage());
        }
    }
    public function updateTransportCompany(Request $request, Response $response, $args) {
        try {
            $id= $args['id'] ?? null;
            $data = $request->getParsedBody();
            if (!isset($id) || !isset($data['name']) || !isset($data['url'])) {
                echo "Invalid input data. 'id', 'name', and 'url' are required.";
                return $response->withStatus(400);
            }
            $company = new TransportCompany($data);
            $this->transportCompanyService->update($company);
            echo "Transport company updated successfully.";
            return $response->withStatus(200);
        } catch (Throwable $e) {
            throw new Exception("Error updating transport company: " . $e->getMessage());
        }
    }
}