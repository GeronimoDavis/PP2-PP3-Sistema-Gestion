<?php
namespace Config;

use PDO;


class DataBase {

    private static $db;
  
    public static function Connect()
    {
        // ========================================
        // CONFIGURACIÓN PARA MYSQL NATIVO
        // ========================================
        $host = $_ENV["DB_HOST"] ?? '127.0.0.1';
        $port = $_ENV["DB_PORT"] ?? '3306';
        $dbname = $_ENV["DB_NAME"] ?? 'stockRepuestos';
        $user = $_ENV["DB_USER"] ?? 'willian';
        $pass = $_ENV["DB_PASS"] ?? '1993';
        
        /*
        // Para XAMPP, usar socket en lugar de host:port
        $socket = '/opt/lampp/var/mysql/mysql.sock';
        
        if (file_exists($socket)) {
            $connectionString = "mysql:unix_socket=$socket;dbname=$dbname;charset=utf8";
        } else {
            $connectionString = "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8";
        }
        
        // ========================================
        // CONFIGURACIÓN PARA WINDOWS/XAMPP
        // ========================================
        /*
        $connectionString = 'mysql:host=' . $_ENV["DB_HOST"]. ';dbname=' . $_ENV["DB_NAME"]. ';charset=utf8';
        self::$db = new PDO($connectionString, $_ENV["DB_USER"], $_ENV["DB_PASS"]);
        */


        // Conexión directa por host:puerto (MySQL nativo)
        $connectionString = "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8";
        
        self::$db = new PDO($connectionString, $user, $pass);
        self::$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        self::$db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_OBJ);
        return self::$db;
    }
}
?>

