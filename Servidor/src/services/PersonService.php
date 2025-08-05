<?php
namespace Services;

use Config\DataBase;
use Entities\Person;
use Exception;
use PDO;
use PDOException;

class PersonService {
    private $pdo;

    public function __construct()
    {
        try {
            $this->pdo = DataBase::Connect();
        } catch (PDOException $e) {
            throw new Exception('Database connection error: ' . $e->getMessage());
        }
    }

    public function getAll(array $filters = [])
    {
        try {
            $query = "SELECT * FROM person WHERE active = 1";
            $params = [];

            //filtrar por razon social
            if (isset($filters['company_name'])) {
                $query .= " AND company_name LIKE ?";
                $params[] = '%' . $filters['company_name'] . '%';
            }

            //filtrar por nombre
            if (isset($filters['name'])) {
                $query .= " AND name LIKE ?";
                $params[] = '%' . $filters['name'] . '%';
            }

            //filtrar por email
            if (isset($filters['email'])) {
                $query .= " AND email LIKE ?";
                $params[] = '%' . $filters['email'] . '%';
            }
            //filtrar por telefono
            if (isset($filters['phone'])) {
                $query .= " AND phone LIKE ?";
                $params[] = '%' . $filters['phone'] . '%';
            }

           if (isset($filters['tax_type'])) {
                $query .= " AND tax_type = ?";
                $params[] = $filters['tax_type'];
            }
            
            if (isset($filters['provider'])) {
                $query .= " AND provider = ?";
                $params[] = filter_var($filters['provider'], FILTER_VALIDATE_BOOLEAN) ? 1 : 0;
            }

            $query .= " ORDER BY name ASC"; 

            $stmt = $this->pdo->prepare($query);
            $stmt->execute($params);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $persons = [];
            foreach ($rows as $row) {
                $persons[] = new Person($row);
            }

            return $persons;
        } catch (PDOException $e) {
            throw new Exception("Error fetching all persons: " . $e->getMessage());
        }
    }

    public function getById($id)
    {
        try {
            $stmt = $this->pdo->prepare("SELECT * FROM person WHERE person_id = ?");
            $stmt->execute([$id]);
            $person = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$person) {
                throw new Exception("Person not found with ID: $id");
            }

            return new Person($person);
        } catch (PDOException $e) {
            throw new Exception("Error fetching person by ID $id: " . $e->getMessage());
        }
    }

    public function create(Person $person)
    {
        try {
            $stmt = $this->pdo->prepare("INSERT INTO person (tax_id, company_name, name, email, phone, notes, address, provider, tax_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $person->tax_id,
                $person->company_name,
                $person->name,
                $person->email,
                $person->phone,
                $person->notes,
                $person->address,
                $person->provider,
                $person->tax_type
            ]);

            $person->person_id = $this->pdo->lastInsertId();

            return $person;
        } catch (PDOException $e) {
            throw new Exception("Error creating person: " . $e->getMessage());
        }
    }

    public function updateStatus($id)
    {
        try {
            $stmt = $this->pdo->prepare("UPDATE person SET active = 0 WHERE person_id = ? AND active = 1"); //no se elimina, se desactiva
            $stmt->execute([$id]);

            if ($stmt->rowCount() === 0) {
                throw new Exception("No person found with ID: $id or person is already inactive");  
            }
        } catch (PDOException $e) {
            throw new Exception("Error updating person status with ID $id: " . $e->getMessage());
        }
    }

    public function update(Person $person)
    {
        try {
            $stmt = $this->pdo->prepare("UPDATE person SET tax_id = ?, company_name = ?, name = ?, email = ?, phone = ?, notes = ?, address = ?, provider = ?, tax_type = ? WHERE person_id = ?");
            $stmt->execute([
                $person->tax_id,
                $person->company_name,
                $person->name,
                $person->email,
                $person->phone,
                $person->notes,
                $person->address,
                $person->provider,
                $person->tax_type,
                $person->person_id
            ]);

            return $person;
        } catch (PDOException $e) {
            throw new Exception("Error updating person: " . $e->getMessage());
        }
    }

    public function getProviderPerson($id)
    {
        try {
            $stmt = $this->pdo->prepare("SELECT * FROM person WHERE provider = 1 AND person_id = ?");
            $stmt->execute([$id]);
            $person = $stmt->fetch(PDO::FETCH_ASSOC);
            return new Person($person);
        } catch (PDOException $e) {
            throw new Exception("Error fetching provider person: " . $e->getMessage());
        }
    }

    public function getClientPerson($id)
    {
        try {
            $stmt = $this->pdo->prepare("SELECT * FROM person WHERE provider = 0 AND person_id = ?");
            $stmt->execute([$id]);
            $person = $stmt->fetch(PDO::FETCH_ASSOC);
            return new Person($person);
        } catch (PDOException $e) {
            throw new Exception("Error fetching client person: " . $e->getMessage());
        }
    }
}
?>
