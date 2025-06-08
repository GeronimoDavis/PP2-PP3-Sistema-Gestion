<?php
namespace Services;
use Config\DataBase;
use Exception;
use PDO;
use PDOException;

class ClientServices{
    private $pdo;
    public function __construct()
    {
        try {
           $this->pdo = DataBase::Connect();
        } catch (PDOException $e) {
            throw new Exception('Error en la conecion con la base de datos' . $e->getMessage());
        }
        
    }

    public function GetAll()
    {
        try {
            $stmt = $this->pdo->prepare("SELECT * FROM personas ORDER BY razon_social");
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw new Exception("Error al obtener todas las personas: " . $e->getMessage());
        }

    }

    public function GetById($id)
    {
      try{
        $stmt = $this->pdo->prepare("SELECT * FROM personas WHERE id = ?");
        $stmt->execute([$id]);
        $persona = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$persona) {
            throw new Exception("Persona no encontrada con el ID: $id");
        }
        return $persona;
        }catch (PDOException $e) {
            throw new Exception("Error al obtener la persona con ID $id: " . $e->getMessage());
        }
    }
        
    
       
         

}


?>