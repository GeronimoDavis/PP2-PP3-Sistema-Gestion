<?php

require 'vendor/autoload.php';
require_once __DIR__.'/../config/mailer.php';

namespace Controllers;

use Services\UserService;
use Entities\User;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Message\ResponseInterface as Response;
use Exception;
use Throwable;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use PHPMailer\PHPMailer\PHPMailer;


class UserController
{
    private UserService $userService;

    public function __construct()
    {
        $this->userService = new UserService();
    }

    public function register(Request $request, Response $response): Response
    {

        try {
            $data = $request->getParsedBody();

            // validacion de username y password
            if (!isset($data['username']) || empty(trim($data['username']))) {
                $response->getBody()->write(json_encode(['error' => 'Nombre de usuario invalido o faltante']));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
            }
            if (!isset($data['password']) || empty(trim($data['password']))) {
                $response->getBody()->write(json_encode(['error' => 'Contraseña invalida o faltante']));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
            }

            $user = new User($data);
            $createdUser = $this->userService->create($user);

            $response->getBody()->write(json_encode($createdUser->toArray()));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(201);
        } catch (Throwable $e) {
            $response->getBody()->write(json_encode(['error' => $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }
    }

    public function login(Request $request, Response $response): Response
    {
        try {
            $data = $request->getParsedBody();

            // validacion de username y password
            if (!isset($data['username']) || empty(trim($data['username']))) {
                $response->getBody()->write(json_encode(['error' => 'Nombre de usuario invalido o faltante']));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
            }
            if (!isset($data['password']) || empty(trim($data['password']))) {
                $response->getBody()->write(json_encode(['error' => 'Contraseña invalida o faltante']));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
            }

            $user = $this->userService->findByUsername($data['username']);

            if (!$user || !password_verify($data['password'], $user->password)) {
                $response->getBody()->write(json_encode(['error' => 'Credenciales invalidas']));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(401);
            }

            $payload = [
                'user_id' => $user->user_id,
                'username' => $user->username,
                'role' => $user->role,
                'exp' => time() + 60 * 60 * 24 // tiempo de validez
            ];

            $jwt = JWT::encode($payload, $_ENV["JWT_SECRET"], 'HS256');

            $response->getBody()->write(json_encode([
                'token' => $jwt,
                'user' => $user->toArray()
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        } catch (Throwable $e) {
            $response->getBody()->write(json_encode(['error' => $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(401);
        }
    }

    // Genera una contraseña aleatoria
    private function generateRandomPassword($length = 10)
    {
        return bin2hex(random_bytes($length / 2));
    }

    // Hashea y actualiza en la DB
    public function recoverPass(Request $request, Response $response, $args)
    {

        try {
            if (isset($args['username']) && !empty($args['username'])) {

                $username = $args['username'];
                $newPassword = $this->generateRandomPassword();
                $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
                $this->userService->recoverPass($username, $hashedPassword);
                $response->getBody()->write(json_encode(['newPassword' => $newPassword]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
            }
        } catch (Exception $e) {
            $response->getBody()->write(json_encode(['Error: ' . $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }
    }

    // Necesito aclarar la forma de guardar la contraseña que viene de recoverPass
    // para enviarla por mail.
    public function enviarCorreo(Request $request, Response $response, $args)
    {

        $mail = new PHPMailer(true);

        try {
            $newPassword = $this->recoverPass();
            $mail->isSMTP();
            $mail->Host = $_ENV['MAIL_HOST'];
            $mail->SMTPAuth = true;
            $mail->Username = $_ENV['MAIL_USERNAME'];
            $mail->Password = $_ENV['MAIL_PASSWORD'];
            $mail->SMTPSecure = 'tls';
            $mail->Port = $_ENV['MAIL_PORT'];

            $mail->setFrom('iskandersoto21@gmail.com', 'Iskander Soto');
            $mail->addAddress('st_juanma@hotmail.com', 'Juan Soto');

            $mail->isHTML(true);
            $mail->Subject = 'Tu nuevo password';
            $mail->Body = 'Tu nuevo password es: ' . $newPassword;

            $mail->send();
            echo 'Correo enviado con éxito!';
        } catch (Exception $e) {
            echo 'Error al enviar correo: ' . $mail->ErrorInfo;
        }
    }
}
