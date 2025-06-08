<?php

namespace Entities;

class Persona{
    public ?int $id;
    public string $cuit;
    public string $razon_social;
    public ?string $nombre;
    public string $mail;
    public string $tel;
    public ?string $observaciones;
    public string $direccion;
    public string $impuestos;
    
    public function __construct(array $data)
    {
        $this->id = $data['id'] ?? null;
        $this->cuit = $data['cuit'];
        $this->razon_social = $data['razon_social'];
        $this->nombre = $data['nombre'] ?? '';
        $this->mail = $data['mail'];
        $this->tel = $data['tel'];
        $this->observaciones = $data['observaciones'] ?? null;
        $this->direccion = $data['direccion'];
        $this->impuestos = $data['impuestos'];
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'cuit' => $this->cuit,
            'razon_social' => $this->razon_social,
            'nombre' => $this->nombre,
            'mail' => $this->mail,
            'tel' => $this->tel,
            'observaciones' => $this->observaciones,
            'direccion' => $this->direccion,
            'impuestos' => $this->impuestos
        ];
    }

}

?>