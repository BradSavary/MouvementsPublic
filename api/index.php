<?php

ini_set('display_errors', 1);
ini_set('max_execution_time', 120);

require_once "Class/HttpRequest.php";
require_once "Controller/UserController.php";
require_once "Controller/MouvementController.php";
require_once "Controller/LocationController.php";
require_once "Controller/DecesController.php";
require_once "Controller/AdminController.php";
require_once "Controller/UnifiedHistoryController.php";
require_once "Controller/UserPreferencesController.php";
require_once "Controller/LoginHistoryController.php";
require_once "Controller/StatisticsController.php";
require_once "Controller/NoMovementDaysController.php";

// objet HttpRequest qui contient toutes les infos utiles sur la requêtes (voir class/HttpRequest.php)
$request = new HttpRequest();

/**
 *  $router est notre "routeur" rudimentaire.
 * 
 *  C'est un tableau associatif qui associe à chaque nom de ressource 
 *  le Controller en charge de traiter la requête.
 *  Ici ProductController est le controleur qui traitera toutes les requêtes ciblant la ressource "products"
 *  On ajoutera des "routes" à $router si l'on a d'autres ressource à traiter.
 */
$router = [
    "user" => new UserController(),
    "mouvement" => new MouvementController(),
    "location" => new LocationController(),
    "deces" => new DecesController(),
    "admin"=> new AdminController(),
    "unified-history" => new UnifiedHistoryController(),
    "preferences" => new UserPreferencesController(),
    "login-history" => new LoginHistoryController(),
    "statistics"=> new StatisticsController(),
    "no-movement-days" => new NoMovementDaysController(),
];

// on récupère la ressource ciblée par la requête
$route = $request->getRessources();

if ( isset($router[$route]) ){ // si on a un controleur pour cette ressource
    $ctrl = $router[$route];  // on le récupère
    $json = $ctrl->jsonResponse($request); // et on invoque jsonResponse pour obtenir la réponse (json) à la requête (voir class/Controller.php et ProductController.php)
    if ($json){ 
        header("Content-type: application/json;charset=utf-8");
        echo $json;
    }
    else{
        http_response_code(404); // en cas de problème pour produire la réponse, on retourne un 404
    }
    die();
}
http_response_code(404); // si on a pas de controlleur pour traiter la requête -> 404
die();

?>