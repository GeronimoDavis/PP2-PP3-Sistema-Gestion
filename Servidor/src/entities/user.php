<?php
namespace Entities;

class User
{
    public ?int $user_id;
    public string $username;
    public string $password;
    public string $role;

    public function __construct(array $data)
    {
        $this->user_id = $data['user_id'] ?? null;
        $this->username = $data['username'];
        $this->password = $data['password'];
        $this->role = $data['role'] ?? 'user'; // Rol por defecto 'user'
    }

    public function toArray(): array
    {
        // NUNCA incluir el password en la respuesta
        return [
            'user_id' => $this->user_id,
            'username' => $this->username,
            'role' => $this->role,
        ];
    }
} 