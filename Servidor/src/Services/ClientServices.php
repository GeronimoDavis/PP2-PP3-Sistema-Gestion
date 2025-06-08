<?php
namespace Services;
use Config\DataBase;
use Entities\Persona;
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
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);//se obtienen todas las filas de la tabla personas como un array asociativo
            
            //por cada fila, crear una instancia de Persona
            $personas = [];
            foreach ($rows as $row) {
                $personas[] = new Persona($row);
            }

            return $personas;//se devuelve un array de objetos Persona

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
        //retorna una instancia de Persona con los datos obtenidos del array asociativo
        return new Persona($persona);
        }catch (PDOException $e) {
            throw new Exception("Error al obtener la persona con ID $id: " . $e->getMessage());
        }
    }
        
    public function Create(Persona $persona)
    {
        try{
            $stmt = $this->pdo->prepare("INSERT INTO personas (cuit, razon_social, nombre, mail, tel, observaciones, direccion, impuestos) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $persona->cuit,
                $persona->razon_social,
                $persona->nombre,
                $persona->mail,
                $persona->tel,
                $persona->observaciones,
                $persona->direccion,
                $persona->impuestos
            ]);

            $persona->id = $this->pdo->lastInsertId(); //asigna el id generado por la base de datos al objeto Persona

            return $persona; //retorna el objeto Persona con el id asignado
        }catch (PDOException $e) {
            throw new Exception("Error al crear la persona: " . $e->getMessage());
        }
    }
       

    public function Delete($id){
        try{
            $stmt = $this->pdo->prepare("DELETE FROM personas WHERE id = ?");
            $stmt->execute([$id]);

            if($stmt->rowCount() === 0) {
                throw new Exception("No se encontró una persona con el ID: $id");
            }
        }catch (PDOException $e) {
            throw new Exception("Error al eliminar la persona con ID $id: " . $e->getMessage());
        }
    }
         

}


?>