<?php
namespace Entities;

class Transaction{
    
    public ?int $transaction_id;
    public string $date;
    public bool $is_sale;
    public int $person_id;
    public ?int $transport_id;
    public ?string $tracking_number;
    public string $tax_type;
    public bool $has_tax;

    public function __construct(array $data) {
        $this->transaction_id = $data['transaction_id'] ?? null;
        $this->date = $data['date'];
        $this->is_sale = (bool)$data['is_sale'];
        $this->person_id = $data['person_id'];
        $this->transport_id = $data['transport_id'] ?? null;
        $this->tracking_number = $data['tracking_number'] ?? null;
        $this->tax_type = $data['tax_type'];
        $this->has_tax = $data['has_tax'] ?? true; // Por defecto TRUE si no se especifica
    }

      public function toArray(): array {
        return [
            'transaction_id' => $this->transaction_id,
            'date' => $this->date,
            'is_sale' => $this->is_sale,
            'person_id' => $this->person_id,
            'transport_id' => $this->transport_id,
            'tracking_number' => $this->tracking_number,
            'tax_type' => $this->tax_type,
            'has_tax' => $this->has_tax
        ];
    }


}


?>