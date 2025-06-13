<?php

class User implements JsonSerializable {
   
    protected $id;
    private $username;
    private $service;
    private $password;

    private $customPermissions = [];
    private $hasCustomPermissions = false;

    public function __construct($id) {
        $this->id = $id;
    }

    public function getId() {
        return $this->id;
    }

    public function jsonSerialize(): mixed {
        return [
            'id' => $this->id,
            "username"=> $this->username,
            "service"=> $this->service,
            "password"=> $this->password,
            "hasCustomPermissions" => $this->hasCustomPermissions
        ];
    }
  
    public function getUsername(){
        return $this->username;
    }

    public function setUsername($username){
        $this->username = $username;
    }

    public function getService(){
        return $this->service;
        
    }
    public function setService($service){
        $this->service = $service;
    }

    public function getPassword(){
        return $this->password;
    }
    
    public function setPassword($password){
        $this->password = $password;
    }


      public function setCustomPermissions(array $permissions) {
        $this->customPermissions = $permissions;
        $this->hasCustomPermissions = !empty($permissions);
    }
    
    public function getCustomPermissions() {
        return $this->customPermissions;
    }
    
    public function hasCustomPermissions() {
        return $this->hasCustomPermissions;
    }
}