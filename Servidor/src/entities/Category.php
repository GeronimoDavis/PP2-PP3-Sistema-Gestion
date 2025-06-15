<?php
namespace Entities;

class Category{
    public ?int $category_id;
    public ?string $description;

    public function __construct(array $data)
    {
        $this->category_id = $data['category_id'] ?? null;
        $this->description = $data['description'] ?? null;
    }

    public function toArray(): array
    {
        return [
            'category_id' => $this->category_id,
            'description' => $this->description,
        ];
    }
}
?>