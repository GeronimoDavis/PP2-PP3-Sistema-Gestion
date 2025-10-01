<?php

namespace Entities;
  enum ExtrasType: string
    {
        case ManoDeObra = 'Mano de obra';
        case Envio = 'Envio';
        case Descuento = 'Descuento';
        case Otro = 'Otro';
        }
class Extras
{

    public int $extra_id;
    public int $transaction_id;
    public float $price;
    public string $note;
    public ExtrasType $type;

    public function __construct(
        int $extra_id,
        int $transaction_id,
        float $price,
        string $note,
        ExtrasType $type
    ) {
        $this->extra_id = $extra_id;
        $this->transaction_id = $transaction_id;
        $this->price = $price;
        $this->note = $note;
        $this->type = $type;
    }
    
   




}
