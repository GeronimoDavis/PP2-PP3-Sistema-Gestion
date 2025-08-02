<?php
namespace Entities;

class Category{
    public ?int $category_id;
    public ?string $name;

    public function __construct(array $data)
    {
        $this->category_id = $data['category_id'] ?? null;
        $this->name = $data['name'] ?? null;
    }

    public function toArray(): array
    {
        return [
            'category_id' => $this->category_id,
            'name' => $this->name,
        ];
    }
}
?>