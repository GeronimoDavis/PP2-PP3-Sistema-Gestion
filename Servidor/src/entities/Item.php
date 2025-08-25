<?php
namespace Entities;

class Item
{
    public $item_id;
    public $transaction_id;
    public $product_id;
    public $quantity;
    public $price;

    public function __construct(Array $data){
        $this->item_id = $data['item_id'] ?? null;
        $this->transaction_id = $data['transaction_id'];
        $this->product_id = $data['product_id'];
        $this->quantity = $data['quantity'];
        $this->price = $data['price'];
    }
    public function toArray(){
        return [
            'item_id' => $this->item_id,
            'transaction_id' => $this->transaction_id,
            'product_id' => $this->product_id,
            'quantity' => $this->quantity,
            'price' => $this->price
        ];
    }
}