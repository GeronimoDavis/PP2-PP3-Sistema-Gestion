<?php

namespace Services;

use Config\DataBase;
use Entities\User;
use PDO;
use PDOException;
use Exception;

class UserService
{
    private $db;

    public function __construct()
    {
        $this->db = DataBase::Connect();
    }

    public function findByUsername(string $username): ?User
    {
        try {
            $stmt = $this->db->prepare("SELECT * FROM users WHERE username = :username");
            $stmt->bindParam(':username', $username, PDO::PARAM_STR);
            $stmt->execute();
            $data = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($data) {
                return new User($data);
            }
            return null;
        } catch (PDOException $e) {
            throw new Exception("Error al buscar usuario: " . $e->getMessage());
        }
    }

    public function create(User $user): User
    {
        try {
            // Verificar si el usuario ya existe
            if ($this->findByUsername($user->username)) {
                throw new Exception("El nombre de usuario ya esta en uso");
            }

            // Hashear la contrasena antes de guardarla
            $hashedPassword = password_hash($user->password, PASSWORD_DEFAULT);

            $stmt = $this->db->prepare(
                "INSERT INTO users (username, password, role) 
                 VALUES (:username, :password, :role)"
            );
            $stmt->bindParam(':username', $user->username, PDO::PARAM_STR);
            $stmt->bindParam(':password', $hashedPassword, PDO::PARAM_STR);
            $stmt->bindParam(':role', $user->role, PDO::PARAM_STR);

            $stmt->execute();
            $user->user_id = $this->db->lastInsertId();

            return $user;
        } catch (PDOException $e) {
            throw new Exception("Error al crear usuario: " . $e->getMessage());
        }
    }

    public function recoverPass($username, $hashedPassword)
    {
        // tabla user no tiene email, utilizo el username
        try{
            $stmt = $this->db->prepare("UPDATE users SET password = :password WHERE username = :username");
            $stmt->bindParam(':password', $hashedPassword, PDO::PARAM_STR);
            $stmt->bindParam(':username', $username, PDO::PARAM_STR);
            $stmt->execute();
        }
        catch (PDOException $e) {
            throw new Exception("Error al recuperar contraseña: " . $e->getMessage());
        }
    }
}
