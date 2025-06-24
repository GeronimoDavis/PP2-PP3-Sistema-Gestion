<?php
namespace Entities;

use DateTime;

enum PaymentsType: string
  {
      case Efectivo = 'Efectivo';
      case Transferencia = 'Transferencia';
      case Cheque = 'Cheque';
      case Otro = 'Otro';
  }
class Payments
{
    public int $payment_id;
    public int $transaction_id;
    public float $amount;
    public PaymentsType $type;
    public DateTime $date;

    public function __construct(
        int $payment_id,
        int $transaction_id,
        float $amount,
        PaymentsType $type,
        DateTime $date
    ) {
        $this->payment_id = $payment_id;
        $this->transaction_id = $transaction_id;
        $this->amount = $amount;
        $this->type = $type;
        $this->date = $date;
    }

    public function toArray(): array
    {
        return [
            'payment_id' => $this->payment_id,
            'transaction_id' => $this->transaction_id,
            'amount' => $this->amount,
            'type' => $this->type->value,
            'date' => $this->date->format('Y-m-d H:i:s')
        ];
    }
}