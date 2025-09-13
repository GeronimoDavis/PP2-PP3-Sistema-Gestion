<?php
namespace Config;

use PDO;


class DataBase {

    private static $db;
  
    public static function Connect()
    {
        $connectionString = 'mysql:host=' . $_ENV["DB_HOST"]. ';dbname=' . $_ENV["DB_NAME"]. ';charset=utf8';
        self::$db = new PDO($connectionString, $_ENV["DB_USER"], $_ENV["DB_PASS"]);
        self::$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        self::$db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_OBJ);
        return self::$db;
    }
}
?>

