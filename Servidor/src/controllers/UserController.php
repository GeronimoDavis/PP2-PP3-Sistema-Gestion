<?php
namespace Controllers;

use Services\UserService;
use Entities\User;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Message\ResponseInterface as Response;
use Exception;
use Throwable;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

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
                throw new Exception('Nombre de usuario invalido o faltante');
            }
            if (!isset($data['password']) || empty(trim($data['password']))) {
                throw new Exception('Contrasena invalido o faltante');
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
                throw new Exception('Nombre de usuario invalido o faltante');
            }
            if (!isset($data['password']) || empty(trim($data['password']))) {
                throw new Exception('Contrasena invalido o faltante');
            }

            $user = $this->userService->findByUsername($data['username']);

            if (!$user || !password_verify($data['password'], $user->password)) {
                throw new Exception('Credenciales invalidas');
            }

            $payload = [
                'user_id' => $user->user_id,
                'username' => $user->username,
                'role' => $user->role,
                'exp' => time() + 60*60*24 // tiempo de validez
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
} 