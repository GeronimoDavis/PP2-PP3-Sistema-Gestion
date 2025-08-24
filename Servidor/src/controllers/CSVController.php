<?php
namespace Controllers;
use Services\TransactionService;
use Exception;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Message\ResponseInterface as Response;

class CSVController {
    private $transactionService;

    public function __construct() {
        $this->transactionService = new TransactionService();
    }

    private function generateCSV(array $data): string {
        // Si no hay datos, retorna un string vacío.
        if (empty($data)) {
            return '';
        }
    
        // Usamos un flujo de memoria para "escribir" el CSV sin crear un archivo físico en el servidor.
        $stream = fopen('php://memory', 'w');
    
        // 1. Escribir la fila de encabezados (las columnas).
        // Obtenemos los nombres de las columnas del primer elemento del array.
        // Esto asume que todos los elementos tienen la misma estructura.
        $headers = array_keys((array)$data[0]);
        fputcsv($stream, $headers);
    
        // 2. Escribir las filas de datos.
        // Recorremos cada venta y la escribimos en el flujo.
        foreach ($data as $row) {
            fputcsv($stream, (array)$row);
        }
    
        // 3. Regresar al inicio del flujo para leer todo el contenido.
        rewind($stream);
    
        // 4. Leer el contenido completo del flujo y guardarlo en una variable.
        $csvContent = stream_get_contents($stream);
    
        // 5. Cerrar el flujo.
        fclose($stream);
    
        return $csvContent;
    }

    public function exportSales(Request $request, Response $response): Response {
        try {
            $sales = $this->transactionService->getAllSales();
            $csvContent = $this->generateCSV($sales);
            $response->getBody()->write($csvContent);
            return $response->withHeader('Content-Type', 'text/csv')
                ->withHeader('Content-Disposition', 'attachment; filename="ventas.csv"')
                ->withStatus(200);
        } catch (Exception $e) {
            $response->getBody()->write(json_encode(['error' => $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')
                ->withStatus(500);
        }
    }
}
?>