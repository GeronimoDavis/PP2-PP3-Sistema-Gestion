<?php
namespace Middlewares;

use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Server\RequestHandlerInterface as Handler;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;


class AuthMiddleware
{
    public function __invoke(Request $request, Handler $handler): Response
    {
        $authHeader = $request->getHeaderLine('Authorization');
        if (!$authHeader || strpos($authHeader, 'Bearer ') !== 0) {
            $response = new \Slim\Psr7\Response();
            $response->getBody()->write(json_encode(['error' => 'Token no enviado']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(401);
        }

        $token = substr($authHeader, 7);

        try {
            //datos de usuario guardado por si es nesesasrear
            $decoded = JWT::decode($token, new Key($_ENV["JWT_SECRET"], 'HS256'));
            $request = $request->withAttribute('user', $decoded);

        } catch (\Exception $e) {
            $response = new \Slim\Psr7\Response();
            $response->getBody()->write(json_encode(['error' => 'Token invalido: ' . $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(401);
        }

        return $handler->handle($request);
    }
} 