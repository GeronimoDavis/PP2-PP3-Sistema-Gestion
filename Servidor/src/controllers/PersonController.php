<?php
namespace Controllers;

use Services\PersonService;
use Entities\Person;
use Throwable;
use Exception;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Message\ResponseInterface as Response;

class PersonController {
    private PersonService $personService;

    public function __construct()
    {
        $this->personService = new PersonService();
    }

    public function getAllPersons(Request $request, Response $response, $args)
    {
        try {
            $filters = $request->getQueryParams();
            $persons = $this->personService->getAll($filters);
            $personsArray = array_map(fn($p) => $p->toArray(), $persons);
            $response->getBody()->write(json_encode(['persons' => $personsArray]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        } catch (Throwable $e) {
            $response->getBody()->write(json_encode(['error' => 'Error fetching persons: ' . $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function getPersonById(Request $request, Response $response, $args)
    {
        try {
            $id = $args['id'];
            $person = $this->personService->getById($id);
            $response->getBody()->write(json_encode(['person' => $person->toArray()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        } catch (Throwable $e) {
            $response->getBody()->write(json_encode(['error' => 'Error fetching person by ID: ' . $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function createPerson(Request $request, Response $response, $args)
    {
        try {
            $data = $request->getParsedBody();
            //validaciones

            if (!isset($data["email"]) || !filter_var($data["email"], FILTER_VALIDATE_EMAIL)) {
                throw new Exception("Invalid email format");
            }

            if (!isset($data['tax_id']) || strlen($data['tax_id']) !== 11) {
                throw new Exception("Invalid tax ID");
            }

            $validTaxTypes = ["R.I", "Exento", "R.N.I", "Monotributo", "Consumidor Final"];
            if (!isset($data['tax_type']) || !in_array($data['tax_type'], $validTaxTypes)) {
                throw new Exception("Invalid tax type");
            }

            $person = new Person($data);
            $createdPerson = $this->personService->create($person);
            $response->getBody()->write(json_encode(['person' => $createdPerson->toArray()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(201);
        } catch (Throwable $e) {
            $response->getBody()->write(json_encode(['error' => 'Error creating person: ' . $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function updatePersonStatus(Request $request, Response $response, $args)
    {
        try {  //no se elimina, se desactiva
            $id = $args["id"];
            $this->personService->updateStatus($id);
            $response->getBody()->write(json_encode(['message' => 'Person status updated successfully']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        } catch (Throwable $e) {
            $response->getBody()->write(json_encode(['error' => 'Error updating person status: ' . $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function updatePerson(Request $request, Response $response, $args)
    {
        try {
            $id = $args['id'];
            $data = $request->getParsedBody();
            //validaciones
            if (!isset($data["email"]) || !filter_var($data["email"], FILTER_VALIDATE_EMAIL)) {
                throw new Exception("Invalid email format");
            }
            if (!isset($data['tax_id']) || strlen($data['tax_id']) !== 11) {
                throw new Exception("Invalid tax ID");
            }
            $validTaxTypes = ["R.I", "Exento", "R.N.I", "Monotributo", "Consumidor Final"];
            if (!isset($data['tax_type']) || !in_array($data['tax_type'], $validTaxTypes)) {
                throw new Exception("Invalid tax type");
            }


            $person = new Person($data);
            $person->person_id = $id;
            $this->personService->update($person);
            $response->getBody()->write(json_encode(['message' => 'Person updated successfully']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        } catch (Throwable $e) {
            $response->getBody()->write(json_encode(['error' => 'Error updating person: ' . $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function clientPerson(Request $request, Response $response, $args)
    {
        try {
            $id = $args['id'];
            $person = $this->personService->getById($id);
        }
        catch (Throwable $e) {
            $response->getBody()->write(json_encode(['error' => 'Error updating person: ' . $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function providerPerson(Request $request, Response $response, $args)
    {
        try {
            $id = $args['id'];
            $person = $this->personService->getById($id);
        }
        catch (Throwable $e) {
            $response->getBody()->write(json_encode(['error' => 'Error updating person: ' . $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }   

    public function getAllActiveClients(Request $request, Response $response, $args)
    {
        try {
            $clients = $this->personService->getAllActiveClients();
            $response->getBody()->write(json_encode(['clients' => $clients]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        }
        catch (Throwable $e) {
            $response->getBody()->write(json_encode(['error' => 'Error fetching all active clients: ' . $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }
}
?>
