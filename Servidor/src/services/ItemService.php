<?php
namespace Services;
use Config\DataBase;
use Entities\Item;
use PDO;
use PDOException;
use Exception;
class ItemService
{
    private $db;

    public function __construct()
    {
        $this->db = DataBase::Connect();
    }

    public function getAllItems()
    {
        try {
            $stmt = $this->db->prepare("SELECT * FROM items");
            $stmt->execute();
            $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
            return array_map(function($item) {
                return new Item($item);
            }, $items);
        } catch (PDOException $e) {
            throw new Exception("Error fetching items: " . $e->getMessage());
        }
    }

    public function getItemById($id)
    {
        try {
            $stmt = $this->db->prepare("SELECT * FROM items WHERE item_id = :id");
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);
            $stmt->execute();
            $item = $stmt->fetch(PDO::FETCH_ASSOC);
            return $item ? new Item($item) : null;
        } catch (PDOException $e) {
            throw new Exception("Error fetching item: " . $e->getMessage());
        }
    }
    public function createItem(Item $item)
    {
        try {
            $stmt = $this->db->prepare("INSERT INTO items (transaction_id, product_id, quantity, price) VALUES (:transaction_id, :product_id, :quantity, :price)");
            $stmt->bindParam(':transaction_id', $item->transaction_id);
            $stmt->bindParam(':product_id', $item->product_id);
            $stmt->bindParam(':quantity', $item->quantity);
            $stmt->bindParam(':price', $item->price);
            if ($stmt->execute()) {
                $item->item_id = $this->db->lastInsertId();
                return $item;
            }
            return null;
        } catch (PDOException $e) {
            throw new Exception("Error creating item: " . $e->getMessage());
        }
    }
    public function updateItem(Item $item)
    {
        try {
            $stmt = $this->db->prepare("UPDATE items SET transaction_id = :transaction_id, product_id = :product_id, quantity = :quantity, price = :price WHERE item_id = :item_id");
            $stmt->bindParam(':transaction_id', $item->transaction_id);
            $stmt->bindParam(':product_id', $item->product_id);
            $stmt->bindParam(':quantity', $item->quantity);
            $stmt->bindParam(':price', $item->price);
            $stmt->bindParam(':item_id', $item->item_id, PDO::PARAM_INT);
            return $stmt->execute();
        } catch (PDOException $e) {
            throw new Exception("Error updating item: " . $e->getMessage());
        }
    }
    public function deleteItem($id)
    {
        try {
            $stmt = $this->db->prepare("DELETE FROM items WHERE item_id = :item_id");
            $stmt->bindParam(':item_id', $id, PDO::PARAM_INT);
            return $stmt->execute();
        } catch (PDOException $e) {
            throw new Exception("Error deleting item: " . $e->getMessage());
        }
    }


}