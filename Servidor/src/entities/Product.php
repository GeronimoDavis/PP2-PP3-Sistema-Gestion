<?php
namespace Entities;

class Product {
    public ?int $product_id;
    public string $name;
    public string $code;
    public int $stock;
    public float $purchase_price;
    public float $sell_price;
    public ?int $category_id;
    public ?int $active;
    public ?string $category_name;
    public int $stock_minimum;

    public function __construct(array $data)
    {
        $this->product_id = $data['product_id'] ?? null;
        $this->name = $data['name'] ?? '';
        $this->code = $data['code'] ?? '';
        $this->stock = isset($data['stock']) ? (int)$data['stock'] : 0;
        $this->purchase_price = isset($data['purchase_price']) ? (float)$data['purchase_price'] : 0.0;
        $this->sell_price = isset($data['sell_price']) ? (float)$data['sell_price'] : 0.0;
        $this->category_id = $data['category_id'] ?? null;
        $this->active = $data['active'] ?? 1;
        $this->category_name = $data['category_name'] ?? '';
        $this->stock_minimum = isset($data['stock_minimum']) ? (int)$data['stock_minimum'] : 5;
    }

    public function toArray(): array
    {
        return [
            'product_id' => $this->product_id,
            'name' => $this->name,
            'code' => $this->code,
            'stock' => $this->stock,
            'purchase_price' => $this->purchase_price,
            'sell_price' => $this->sell_price,
            'category_id' => $this->category_id,
            'active' => $this->active,
            'category_name' => $this->category_name,
            'stock_minimum' => $this->stock_minimum,
        ];

    }
}
