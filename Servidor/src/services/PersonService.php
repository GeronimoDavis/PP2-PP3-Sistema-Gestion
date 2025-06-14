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

    public function getAll()
    {
        try {
            $stmt = $this->pdo->prepare("SELECT * FROM person ORDER BY company_name");
            $stmt->execute();
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

    public function delete($id)
    {
        try {
            $stmt = $this->pdo->prepare("DELETE FROM person WHERE person_id = ?");
            $stmt->execute([$id]);

            if ($stmt->rowCount() === 0) {
                throw new Exception("No person found with ID: $id");
            }
        } catch (PDOException $e) {
            throw new Exception("Error deleting person with ID $id: " . $e->getMessage());
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
}
?>
