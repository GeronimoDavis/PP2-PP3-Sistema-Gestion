<?php
namespace Entities;

class Category{
    public ?int $category_id;
    public ?string $category_name;

    public function __construct(array $data)
    {
        $this->category_id = $data['category_id'] ?? null;
        $this->category_name = $data['category_name'] ?? null;
    }

    public function toArray(): array
    {
        return [
            'category_id' => $this->category_id,
            'category_name' => $this->category_name,
        ];
    }
}
?>