<?php
use Controllers\TransactionController;
use Slim\Routing\RouteCollectorProxy;
use Middlewares\AuthMiddleware;

$transactionController = new TransactionController();

$app->group("/transaction", function(RouteCollectorProxy $group) use ($transactionController) {
    $group->get('/', [$transactionController, 'getAllTransactions']);
    $group->get("/show/{id}", [$transactionController, "getTransactionById"]);
    $group->post("/create", [$transactionController, "createTransaction"]);
    $group->put("/update/{id}", [$transactionController, "updateTransaction"]);
    $group->delete("/delete/{id}", [$transactionController, "deleteTransaction"]);
})->add(new AuthMiddleware());

?>