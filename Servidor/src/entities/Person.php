<?php
namespace Entities;

class Person {
    public ?int $person_id;
    public string $tax_id;
    public string $company_name;
    public ?string $name;
    public string $email;
    public string $phone;
    public ?string $notes;
    public string $address;
    public bool $provider;
    public string $tax_type;
    public bool $active;

    public function __construct(array $data)
    {
        $this->person_id = $data['person_id'] ?? null;
        $this->tax_id = $data['tax_id'];
        $this->company_name = $data['company_name'];
        $this->name = $data['name'] ?? null;
        $this->email = $data['email'];
        $this->phone = $data['phone'];
        $this->notes = $data['notes'] ?? null;
        $this->address = $data['address'];
        $this->provider = isset($data['provider']) ? (bool)$data['provider'] : false;
        $this->tax_type = $data['tax_type'];
        $this->active = isset($data['active']) ? (bool)$data['active'] : true;
    }

    public function toArray(): array
    {
        return [
            'person_id' => $this->person_id,
            'tax_id' => $this->tax_id,
            'company_name' => $this->company_name,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'notes' => $this->notes,
            'address' => $this->address,
            'provider' => $this->provider,
            'tax_type' => $this->tax_type,
            'active' => $this->active,
        ];
    }
}
?>
