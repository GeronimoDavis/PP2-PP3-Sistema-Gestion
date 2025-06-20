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
            $persons = $this->personService->getAll();
            $personsArray = array_map(fn($p) => $p->toArray(), $persons);
            $response->getBody()->write(json_encode(['persons' => $personsArray]));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (Throwable $e) {
            throw new Exception("Error fetching all persons: " . $e->getMessage());
        }
    }

    public function getPersonById(Request $request, Response $response, $args)
    {
        try {
            $id = $args['id'];
            $person = $this->personService->getById($id);
            $response->getBody()->write(json_encode(['person' => $person->toArray()]));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (Throwable $e) {
            throw new Exception("Error fetching person by ID: " . $e->getMessage());
        }
    }

    public function createPerson(Request $request, Response $response, $args)
    {
        try {
            $data = $request->getParsedBody();
            $person = new Person($data);
            $createdPerson = $this->personService->create($person);
            $response->getBody()->write(json_encode(['person' => $createdPerson->toArray()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(201);
        } catch (Throwable $e) {
            throw new Exception("Error creating person: " . $e->getMessage());
        }
    }

    public function deletePerson(Request $request, Response $response, $args)
    {
        try {
            $id = $args["id"];
            $this->personService->delete($id);
            $response->getBody()->write(json_encode(['message' => 'Person deleted successfully']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        } catch (Throwable $e) {
            throw new Exception("Error deleting person: " . $e->getMessage());
        }
    }

    public function updatePerson(Request $request, Response $response, $args)
    {
        try {
            $id = $args['id'];
            $data = $request->getParsedBody();
            $person = new Person($data);
            $person->person_id = $id;
            $this->personService->update($person);
            $response->getBody()->write(json_encode(['message' => 'Person updated successfully']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        } catch (Throwable $e) {
            throw new Exception("Error updating person: " . $e->getMessage());
        }
    }
}
?>
