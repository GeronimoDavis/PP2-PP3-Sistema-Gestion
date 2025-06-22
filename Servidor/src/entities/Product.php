<?php
namespace Entities;

class Product {
    public ?int $product_id;
    public string $description;
    public string $code;
    public int $stock;
    public float $purchase_price;
    public ?int $category_id;

    public function __construct(array $data)
    {
        $this->product_id = $data['product_id'] ?? null;
        $this->description = $data['description'] ?? '';
        $this->code = $data['code'] ?? '';
        $this->stock = isset($data['stock']) ? (int)$data['stock'] : 0;
        $this->purchase_price = isset($data['purchase_price']) ? (float)$data['purchase_price'] : 0.0;
        $this->category_id = $data['category_id'] ?? null;
    }

    public function toArray(): array
    {
        return [
            'product_id' => $this->product_id,
            'description' => $this->description,
            'code' => $this->code,
            'stock' => $this->stock,
            'purchase_price' => $this->purchase_price,
            'category_id' => $this->category_id,
        ];
    }
}
