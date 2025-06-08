<?php
namespace Config;

use PDO;

class DataBase{
    private static $db;
    private static $user = 'root';
    private static $host = 'localhost';
    private static $password = '';
    private static $database = 'stockRepuestos';
    

    public static function Connect()
    {
      $connectionstring = 'mysql:host='.self::$host.';dbname='.self::$database.'; charset=utf8';
      self::$db = new PDO ($connectionstring, self::$user, self::$password);
      self::$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
      self::$db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_OBJ);
      return self::$db;


    }



}


?>

