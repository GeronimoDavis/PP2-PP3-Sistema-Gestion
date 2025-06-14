
<?php
namespace Entities;

class Product {
   private ?int $product_id;
   private string $description;
   private string $code;
   private int $stock;
   private float $purchase_price;
   private ?int $category_id;



  public function __construct(array $data)
    {
        $this->product_id = $data['product_id'] ?? null;
        $this->description = $data['description'];
        $this->code = $data['code'];    
        $this->stock = $data['stock'];
        $this->purchase_price = $data['purchase_price'];
        $this->category_id = $data['category_id'] ?? null;
    }
    public function toArray(): array
    {
        return[
            'product_id' => $this->product_id,
            'description' => $this->description,
            'code' => $this->code,
            'stock' => $this->stock,
            'purchase_price' => $this->purchase_price,
            'category_id' => $this->category_id
        ];

    }
}

?>