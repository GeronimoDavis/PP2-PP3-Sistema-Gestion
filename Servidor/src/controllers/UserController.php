<?php

namespace Controllers;

require_once __DIR__.'/../utils/mail.php';

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
                'name' => $user->name,
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
        return bin2hex(random_bytes($length));
    }

    // Hashea y actualiza en la DB
    public function recoverPass(Request $request, Response $response, $args)
    {

        try {
            $data = $request->getParsedBody();
            $username = $data['username'];
            if (!isset($username) || empty(trim($username)) || !$this->userService->findByUsername($username)) {
                $response->getBody()->write(json_encode(['error' => 'Nombre de usuario invalido o faltante']));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
            } else {
                // $user = $this->userService->findByUsername($username);
                // if (!$user) {
                //     $response->getBody()->write(json_encode(['message' => 'Si el usuario existe, se ha enviado un correo para recuperar la contraseña.']));
                //     return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
                // }
                
            $newPassword = $this->generateRandomPassword();
            $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
            $this->userService->recoverPass($username, $hashedPassword);
            $cuerpoMail = "
            <div style='height: 100px; width: 100%; background-color: #22aa22;'>
            </div>
            <div style=''>
            <h1 style='text-align: center; font-family: sans-serif;'>${username}, tu nueva contraseña es: <b style='color: #333;'>${newPassword}</b></h1>
            <p style='text-align: center; font-family: sans-serif;'>Recuerda cambiar tu contraseña por una más segura</p>
            </div>
            <div style='height: 100px; width: 100%; background-color: #22aa22;'>
            ";
            
            try {
                enviarCorreo($cuerpoMail, utf8_decode('Recuperación de contraseña'), 'st_juanma@hotmail.com');
                $response->getBody()->write(json_encode(['message' => 'Contraseña recuperada con éxito y enviada por correo']));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
            } catch (Exception $mailException) {
                $response->getBody()->write(json_encode([
                    'message' => 'Contraseña recuperada con éxito, pero hubo un error al enviar el correo: ' . $mailException->getMessage()
                ]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
            }
            }
        } catch (Exception $e) {
            $response->getBody()->write(json_encode(['Error: ' . $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }
    }

    public function updatePass(Request $request, Response $response, $args)
    {
        try {
            $data = $request->getParsedBody();
            $newPassword = $data['newPassword'];
            $username = $data['username'];

            // validacion de username y password
            if (!isset($newPassword) || empty(trim($newPassword))) {
                $response->getBody()->write(json_encode(['error' => 'Nueva contraseña invalida o faltante']));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
            }

            $user = $this->userService->findByUsername($username);
            if (!$user) {
                $response->getBody()->write(json_encode(['error' => 'Usuario no encontrado']));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

            if (!password_verify($data['oldPassword'], $user->password)) {
                $response->getBody()->write(json_encode(['error' => 'Contraseña actual incorrecta ❌']));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(401);
            }

            $hashedNewPassword = password_hash($newPassword , PASSWORD_DEFAULT);
            $this->userService->updatePassword($username, $hashedNewPassword);

            $response->getBody()->write(json_encode(['message' => 'Contraseña actualizada con éxito']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        } catch (Exception $e) {
            $response->getBody()->write(json_encode(['error' => $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }
    }

}
