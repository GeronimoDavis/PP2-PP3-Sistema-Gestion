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
            $stmt = $this->pdo->prepare("SELECT * FROM clientes ORDER BY Nombre");
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw new Exception("Error al atraer todos los productos" . $e->getMessage());
        }

    }

}


?>