<?php
namespace Controllers;
use Services\PaymentsService;
use Entities\Payments;
use Entities\PaymentsType;
use Exception;
use PDOException;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Message\ResponseInterface as Response;

class PaymentsController 
{
    private PaymentsService $paymentsService;

    public function __construct()
    {
        $this->paymentsService = new PaymentsService();
    }
    public function getAllPayments(Request $request, Response $response): Response
    {
        try {
            $payments = $this->paymentsService->getAll();
            $paymentsArray = array_map(fn($p) => $p->toArray(), $payments);
            $response->getBody()->write(json_encode(['payments' => $paymentsArray]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        } catch (Exception $e) {
            $response->getBody()->write("Error fetching payments: " . $e->getMessage());
            return $response->withStatus(500);
        }
    }
    public function getPaymentById(Request $request, Response $response, array $args): Response
    {
        try {
            $payment = $this->paymentsService->getById($args['id']);
            if ($payment) {
                $response->getBody()->write(json_encode(['payment' => $payment->toArray()]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
            } else {
                $response->getBody()->write("Payment not found");
                return $response->withStatus(404);
            }
        } catch (Exception $e) {
            $response->getBody()->write("Error fetching payment: " . $e->getMessage());
            return $response->withStatus(500);
        }
    }
    public function createPayment(Request $request, Response $response): Response
    {
        try {
            $data = json_decode($request->getBody()->getContents(), true);

            //validaciones
            if (!isset($data['transaction_id'], $data['amount'], $data['type'], $data['date'])) {
                throw new Exception("Missing required fields.");
            }

             if (!is_numeric($data['amount']) || $data['amount'] <= 0) {
                throw new Exception("Amount must be a positive number.");
            }

            $payment = new Payments(
                0, 
                $data['transaction_id'],
                (float)$data['amount'],
                PaymentsType::from($data['type']),
                new \DateTime($data['date'])
            );
            $createdPayment = $this->paymentsService->create($payment);
            $response->getBody()->write(json_encode(['payment' => $createdPayment->toArray()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(201);
        } catch (Exception $e) {
            $response->getBody()->write("Error creating payment: " . $e->getMessage());
            return $response->withStatus(500);
        }
    }
    public function updatePayment(Request $request, Response $response, array $args): Response
    {
        try {
            $data = json_decode($request->getBody()->getContents(), true);

            //validaciones
            if (!isset($data['transaction_id'], $data['amount'], $data['type'], $data['date'])) {
                throw new Exception("Missing required fields.");
            }

             if (!is_numeric($data['amount']) || $data['amount'] <= 0) {
                throw new Exception("Amount must be a positive number."); 
            }


            $payment = new Payments(
                (int)$args['id'], 
                $data['transaction_id'],
                (float)$data['amount'],
                PaymentsType::from($data['type']),
                new \DateTime($data['date'])
            );
            $updatedPayment = $this->paymentsService->update($payment);
            $response->getBody()->write(json_encode(['payment' => $updatedPayment->toArray()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        } catch (Exception $e) {
            $response->getBody()->write("Error updating payment: " . $e->getMessage());
            return $response->withStatus(500);
        }
    }
    public function deletePayment(Request $request, Response $response, array $args): Response
    {
        try {
            $this->paymentsService->delete($args['id']);
            return $response->withStatus(204);
        } catch (Exception $e) {
            $response->getBody()->write("Error deleting payment: " . $e->getMessage());
            return $response->withStatus(500);
        }
    }
    public function getPaymentsByDateRange(Request $request, Response $response, array $args): Response
    {
        try {
            $startDate = new \DateTime($args['start_date']);
            $endDate = new \DateTime($args['end_date']);
            $payments = $this->paymentsService->getByDateRange($startDate, $endDate);
            $paymentsArray = array_map(fn($p) => $p->toArray(), $payments);
            $response->getBody()->write(json_encode(['payments' => $paymentsArray]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        } catch (Exception $e) {
            $response->getBody()->write("Error fetching payments by date range: " . $e->getMessage());
            return $response->withStatus(500);
        }
    }
    public function getPaymentsByTransactionId(Request $request, Response $response, array $args): Response
    {
        try {
            $payments = $this->paymentsService->getByTransactionId($args['transaction_id']);
            if ($payments) {
                $response->getBody()->write(json_encode(['payment' => $payments->toArray()]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
            } else {
                $response->getBody()->write("No payments found for this transaction");
                return $response->withStatus(404);
            }
        } catch (Exception $e) {
            $response->getBody()->write("Error fetching payments by transaction ID: " . $e->getMessage());
            return $response->withStatus(500);
        }
    }
    public function getPaymentsByType(Request $request, Response $response, array $args): Response
    {
        try {
            $payments = $this->paymentsService->getByType(PaymentsType::from($args['type']));
            if ($payments) {
                $paymentsArray = array_map(fn($p) => $p->toArray(), $payments);
                $response->getBody()->write(json_encode(['payments' => $paymentsArray]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
            } else {
                $response->getBody()->write("No payments found for this type");
                return $response->withStatus(404);
            }
        } catch (Exception $e) {
            $response->getBody()->write("Error fetching payments by type: " . $e->getMessage());
            return $response->withStatus(500);
        }
    }
    
    public function getPaymentStatus(Request $request, Response $response, array $args): Response{
        try{

            $transactionId = (int)$args['transactionId'];

            $status = $this->paymentsService->getPaymentStatus($transactionId);

            $response->getBody()->write(json_encode(['status' => $status]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        }catch(Exception $e){
            $response->getBody()->write("Error fetching payment status: " . $e->getMessage());
            return $response->withStatus(500);
        }
    }
 

}