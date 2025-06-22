<?php
namespace Entities;
class TransportCompany {
    public $company_id;
    public $name;
    public $url;

    public function __construct($data){
        $this->company_id = isset($data['company_id']) ? (int)$data['company_id'] : null;
        $this->name = isset($data['name']) ? $data['name'] : '';
        $this->url = isset($data['url']) ? $data['url'] : '';
    }
    public function toArray():array {
        return [
            'company_id' => $this->company_id,
            'name' => $this->name,
            'url' => $this->url
        ];
    }

   
}