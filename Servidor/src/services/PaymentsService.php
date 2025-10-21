<?php
namespace Services;
use Config\DataBase;
use Entities\Payments;
use Entities\PaymentsType;
use PDO;
use PDOException;
use Exception;
use DateTime;


class PaymentsService {
    private $pdo;

    public function __construct()
    {
        try {
            $this->pdo = DataBase::Connect();
        } catch (PDOException $e) {
            throw new Exception('Database connection error: ' . $e->getMessage());
        }
    }

    public function getAll()
    {
        try {
            $stmt = $this->pdo->prepare("SELECT * FROM payments ORDER BY date");
            $stmt->execute();
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $payments = [];
            foreach ($rows as $row) {
                $payments[] = new Payments(
                    $row['payment_id'],
                    $row['transaction_id'],
                    (float)$row['amount'],
                    PaymentsType::from($row['type']),
                    new DateTime($row['date']),
                    $row['note'] ?? ""
                );
            }

            return $payments;
        } catch (PDOException $e) {
            throw new Exception("Error fetching all payments: " . $e->getMessage());
        }
    }

    public function getById($id)
    {
        try {
            $stmt = $this->pdo->prepare("SELECT * FROM payments WHERE payment_id = ?");
            $stmt->execute([$id]);
            $payment = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$payment) {
                throw new Exception("Payment not found with ID: $id");
            }

            return new Payments(
                $payment['payment_id'],
                $payment['transaction_id'],
                (float)$payment['amount'],
                PaymentsType::from($payment['type']),
                new DateTime($payment['date']),
                $payment['note'] ?? ""
            );
        } catch (PDOException $e) {
            throw new Exception("Error fetching payment by ID $id: " . $e->getMessage());
        }
    }
    public function getAllByDateTime($startDate, $endDate)
    {
        try {
            $stmt = $this->pdo->prepare("SELECT * FROM payments WHERE date BETWEEN ? AND ? ORDER BY date");
            $stmt->execute([$startDate, $endDate]);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $payments = [];
            foreach ($rows as $row) {
                $payments[] = new Payments(
                    $row['payment_id'],
                    $row['transaction_id'],
                    (float)$row['amount'],
                    PaymentsType::from($row['type']),
                    new DateTime($row['date']),
                    $row['note'] ?? ""
                );
            }

            return $payments;
        } catch (PDOException $e) {
            throw new Exception("Error fetching payments by date range: " . $e->getMessage());
        }
    }


    public function create(Payments $payment)
    {
        try {
            $stmt = $this->pdo->prepare("INSERT INTO payments (transaction_id, amount, type, date, note) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([
                $payment->transaction_id,
                number_format($payment->amount, 2, '.', ''),
                $payment->type->value,
                ($payment->date instanceof \DateTime ? $payment->date->format('Y-m-d H:i:s') : date('Y-m-d H:i:s', strtotime($payment->date))),
                $payment->note
            ]);

            $payment->payment_id = $this->pdo->lastInsertId();
            return $payment;
        } catch (PDOException $e) {
            throw new Exception("Error creating payment: " . $e->getMessage());
        }
    }
    public function update(Payments $payment)
    {
        try {
            $stmt = $this->pdo->prepare("UPDATE payments SET transaction_id = ?, amount = ?, type = ?, date = ?, note = ? WHERE payment_id = ?");
            $stmt->execute([
                $payment->transaction_id,
                number_format($payment->amount, 2, '.', ''),
                $payment->type->value,
                ($payment->date instanceof \DateTime ? $payment->date->format('Y-m-d H:i:s') : date('Y-m-d H:i:s', strtotime($payment->date))),
                $payment->note,
                $payment->payment_id
            ]);

            return $payment;
        } catch (PDOException $e) {
            throw new Exception("Error updating payment: " . $e->getMessage());
        }
    }
    public function delete($id)
    {
        try {
            $stmt = $this->pdo->prepare("DELETE FROM payments WHERE payment_id = ?");
            return $stmt->execute([$id]);
        } catch (PDOException $e) {
            throw new Exception("Error deleting payment with ID $id: " . $e->getMessage());
        }
    }
    public function getByTransactionId($transactionId)
    {
        try {
            $stmt = $this->pdo->prepare("SELECT * FROM payments WHERE transaction_id = ?");
            $stmt->execute([$transactionId]);
            $payment = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$payment) {
                throw new Exception("Payment not found for transaction ID: $transactionId");
            }

            return new Payments(
                $payment['payment_id'],
                $payment['transaction_id'],
                (float)$payment['amount'],
                PaymentsType::from($payment['type']),
                new DateTime($payment['date']),
                $payment['note'] ?? ""
            );
        } catch (PDOException $e) {
            throw new Exception("Error fetching payment by transaction ID $transactionId: " . $e->getMessage());
        }
    }
    public function getByDateRange(\DateTime $startDate, \DateTime $endDate)
    {
        try {
            $stmt = $this->pdo->prepare("SELECT * FROM payments WHERE date BETWEEN ? AND ? ORDER BY date");
            $stmt->execute([$startDate->format('Y-m-d H:i:s'), $endDate->format('Y-m-d H:i:s')]);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $payments = [];
            foreach ($rows as $row) {
                $payments[] = new Payments(
                    $row['payment_id'],
                    $row['transaction_id'],
                    (float)$row['amount'],
                    PaymentsType::from($row['type']),
                    new DateTime($row['date']),
                    $row['note'] ?? ""
                );
            }

            return $payments;
        } catch (PDOException $e) {
            throw new Exception("Error fetching payments by date range: " . $e->getMessage());
        }
    }
    public function getByType(PaymentsType $type)
    {
        try {
            $stmt = $this->pdo->prepare("SELECT * FROM payments WHERE type = ?");
            $stmt->execute([$type->value]);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $payments = [];
            foreach ($rows as $row) {
                $payments[] = new Payments(
                    $row['payment_id'],
                    $row['transaction_id'],
                    (float)$row['amount'],
                    PaymentsType::from($row['type']),
                    new DateTime($row['date']),
                    $row['note'] ?? ""
                );
            }

            return $payments;
        } catch (PDOException $e) {
            throw new Exception("Error fetching payments by type: " . $e->getMessage());
        }
    }

    public function getByPersonId($personId)
    {
        try {
            $query = "
                SELECT p.*, t.is_sale
                FROM payments p
                INNER JOIN transaction t ON p.transaction_id = t.transaction_id
                WHERE t.person_id = ?
                ORDER BY p.date DESC
            ";
            
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([$personId]);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $payments = [];
            foreach ($rows as $row) {
                $payment = new Payments(
                    $row['payment_id'],
                    $row['transaction_id'],
                    (float)$row['amount'],
                    PaymentsType::from($row['type']),
                    new DateTime($row['date']),
                    $row['note'] ?? ""
                );
                
                // Agregar información del tipo de transacción
                $paymentArray = $payment->toArray();
                $paymentArray['is_sale'] = (bool)$row['is_sale'];
                $payments[] = $paymentArray;
            }

            return $payments;
        } catch (PDOException $e) {
            throw new Exception("Error fetching payments by person ID: " . $e->getMessage());
        }
    }

    public function getPaymentStatus($transactionId)
    {
        try {
            // Get total amount for the transaction
            $transactionQuery = "SELECT total FROM transaction WHERE transaction_id = ?";
            $stmt = $this->pdo->prepare($transactionQuery);
            $stmt->execute([$transactionId]);
            $transaction = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$transaction) {
                throw new Exception("Transaction not found with ID: $transactionId");
            }

            // Get total paid for the transaction
            $paymentsQuery = "SELECT COALESCE(SUM(amount), 0) as total_paid FROM payments WHERE transaction_id = ?";
            $stmt = $this->pdo->prepare($paymentsQuery);
            $stmt->execute([$transactionId]);
            $paymentsResult = $stmt->fetch(PDO::FETCH_ASSOC);

            $totalTransaction = (float)$transaction['total'];
            $totalPaid = (float)$paymentsResult['total_paid'];

            if ($totalPaid >= $totalTransaction) {
                return 'paid';
            } elseif ($totalPaid > 0) {
                return 'partial';
            } else {
                return 'pending';
            }
        } catch (PDOException $e) {
            throw new Exception("Error getting payment status: " . $e->getMessage());
        }
    }
 

}