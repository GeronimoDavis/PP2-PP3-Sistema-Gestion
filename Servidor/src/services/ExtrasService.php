<?php
 namespace Services;
 use Entities\Extras;
 use Entities\ExtrasType;
 use PDO;
 use PDOException;
 use Exception;
 use Config\DataBase;

 class ExtrasService
 {
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
                $stmt = $this->pdo->prepare("SELECT * FROM extras ORDER BY note");
                $stmt->execute();
                $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
                $extras = [];
                foreach ($rows as $row) {
                    $extras[] = new Extras(
                        $row['extra_id'],
                        $row['transaction_id'],
                        (float)$row['price'],
                        $row['note'],
                        ExtrasType::from($row['type'])
                    );
                }
    
                return $extras;
            } catch (PDOException $e) {
                throw new Exception('Error fetching extras: ' . $e->getMessage());
            }
        }
        public function getById($id)
        {
            try {
                $stmt = $this->pdo->prepare("SELECT * FROM extras WHERE extra_id = ?");
                $stmt->execute([$id]);
                $row = $stmt->fetch(PDO::FETCH_ASSOC);
    
                if (!$row) {
                    throw new Exception("Extra not found with ID: $id");
                }
    
                return new Extras(
                    $row['extra_id'],
                    $row['transaction_id'],
                    (float)$row['price'],
                    $row['note'],
                    ExtrasType::from($row['type'])
                );
            } catch (PDOException $e) {
                throw new Exception("Error fetching extra by ID $id: " . $e->getMessage());
            }
        }
        public function getByType(ExtrasType $type)
        {
            try {
                $stmt = $this->pdo->prepare("SELECT * FROM extras WHERE type = ?");
                $stmt->execute([$type->value]);
                $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
                $extras = [];
                foreach ($rows as $row) {
                    $extras[] = new Extras(
                        $row['extra_id'],
                        $row['transaction_id'],
                        (float)$row['price'],
                        $row['note'],
                        ExtrasType::from($row['type'])
                    );
                }
    
                return $extras;
            } catch (PDOException $e) {
                throw new Exception('Error fetching extras by type: ' . $e->getMessage());
            }
        }

        public function create(Extras $extra)
        {
            try {
                $stmt = $this->pdo->prepare("INSERT INTO extras (transaction_id, price, note, type) VALUES (?, ?, ?, ?)");
                $stmt->execute([
                    $extra->transaction_id,
                    $extra->price,
                    $extra->note,
                    $extra->type->value
                ]);
    
                $extra->extra_id = $this->pdo->lastInsertId();
                return $extra;
            } catch (PDOException $e) {
                throw new Exception('Error creating extra: ' . $e->getMessage());
            }
        }
        public function update(Extras $extra)
        {
            try {
                $stmt = $this->pdo->prepare("UPDATE extras SET transaction_id = ?, price = ?, note = ?, type = ? WHERE extra_id = ?");
                $stmt->execute([
                    $extra->transaction_id,
                    $extra->price,
                    $extra->note,
                    $extra->type->value,
                    $extra->extra_id
                ]);
    
                return $extra;
            } catch (PDOException $e) {
                throw new Exception('Error updating extra: ' . $e->getMessage());
            }
        }
        public function delete($id)
        {
            try {
                $stmt = $this->pdo->prepare("DELETE FROM extras WHERE extra_id = ?");
                $stmt->execute([$id]);
    
                if ($stmt->rowCount() === 0) {
                    throw new Exception("No extra found with ID: $id");
                }
    
                return true;
            } catch (PDOException $e) {
                throw new Exception('Error deleting extra: ' . $e->getMessage());
            }
        }
        
  
 }