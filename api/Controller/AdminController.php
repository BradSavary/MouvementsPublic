<?php

require_once "Controller.php";
require_once "Controller/UserController.php";
require_once "Repository/UserRepository.php";
require_once "Repository/LocationRepository.php";
require_once "Repository/PermissionRepository.php";

class AdminController extends Controller {

    private UserController $userController;
    private UserRepository $users;
    private LocationRepository $locations;
    private PermissionRepository $permissions;

    public function __construct() {
        $this->userController = new UserController();
        $this->users = new UserRepository();
        $this->locations = new LocationRepository();
        $this->permissions = new PermissionRepository();
    }

    protected function processGetRequest(HttpRequest $request) {
        try {
            // Authentification (code existant)...
            
            // Analysons directement l'URL pour plus de fiabilité
            $uri = $_SERVER["REQUEST_URI"];
            error_log("AdminController: URI complète: " . $uri);
            
            // Vérifier si c'est une requête de permissions
            if (strpos($uri, '/api/admin/permissions/') !== false) {
                // Extraire le nom du service de l'URL
                $parts = explode('/api/admin/permissions/', $uri);
                $serviceName = urldecode(end($parts));
                
                // Nettoyer les éventuels paramètres de requête
                if (strpos($serviceName, '?') !== false) {
                    $serviceName = substr($serviceName, 0, strpos($serviceName, '?'));
                }
                
                error_log("AdminController: Service extrait de l'URI: " . $serviceName);
                
                if (empty($serviceName)) {
                    throw new Exception("Nom du service non spécifié.");
                }
                
                // Récupérer les permissions du service
                $permissions = $this->permissions->getServicePermissions($serviceName);
                
                return [
                    'status' => 'success',
                    'data' => $permissions
                ];
            }
            
            // Vérifier si c'est une requête pour les services
            if ($uri === '/api/admin/services' || $uri === '/api/admin/services/') {
                $services = $this->users->getAllServices();
                return [
                    'status' => 'success',
                    'data' => $services
                ];
            }
            
            // Si aucune route correspondante
            throw new Exception("Ressource administrative non reconnue: $uri");
        } catch (Exception $e) {
            error_log("AdminController Error: " . $e->getMessage());
            return [
                'status' => 'error',
                'message' => $e->getMessage()
            ];
        }
    }

    protected function processPostRequest(HttpRequest $request) {
        try {
            // Extraire le token des en-têtes HTTP
            $headers = getallheaders();
            $authHeader = $headers['Authorization'] ?? '';
            
            if (empty($authHeader) || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
                throw new Exception("Token d'authentification manquant ou invalide.");
            }
            
            // Vérifier le token avec le UserController
            $token = $matches[1];
            $tokenData = $this->userController->verifyTokenAndGetUser($token);
            
            if (!$tokenData) {
                throw new Exception("Token d'authentification invalide.");
            }
            
            // Vérifier que l'utilisateur a accès à l'administration
            if ($tokenData['service'] !== 'Admin') {
                throw new Exception("Accès non autorisé à l'administration.");
            }
            
            // Récupérer la ressource ciblée
            $adminResource = $request->getId();
            
            // Récupérer les données de la requête
            $data = json_decode($request->getJson(), true);
            
            // Ajouter un service
            if ($adminResource === 'services') {
                if (!isset($data['name']) || empty($data['name'])) {
                    throw new Exception("Nom du service non spécifié.");
                }
                
                $success = $this->users->addService($data['name']);
                
                if (!$success) {
                    throw new Exception("Erreur lors de l'ajout du service.");
                }
                
                return [
                    "status" => "success",
                    "message" => "Service ajouté avec succès"
                ];
            }
            
            // Ajouter un emplacement
            if ($adminResource === 'locations') {
                if (!isset($data['name']) || empty($data['name']) || !isset($data['type'])) {
                    throw new Exception("Données d'emplacement incomplètes.");
                }
                
                $success = $this->locations->addLocation($data['name'], $data['type']);
                
                if (!$success) {
                    throw new Exception("Erreur lors de l'ajout de l'emplacement.");
                }
                
                return [
                    "status" => "success",
                    "message" => "Emplacement ajouté avec succès"
                ];
            }
            
            // Si aucune ressource spécifique n'est ciblée, renvoyer une erreur
            return [
                "status" => "error",
                "message" => "Ressource administrative non spécifiée"
            ];
        } catch (Exception $e) {
            return [
                "status" => "error",
                "message" => $e->getMessage()
            ];
        }
    }

    protected function processPutRequest(HttpRequest $request) {
        try {
            // Extraire le token des en-têtes HTTP
            $headers = getallheaders();
            $authHeader = $headers['Authorization'] ?? '';
            
            if (empty($authHeader) || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
                throw new Exception("Token d'authentification manquant ou invalide.");
            }
            
            // Vérifier le token avec le UserController
            $token = $matches[1];
            $tokenData = $this->userController->verifyTokenAndGetUser($token);
            
            if (!$tokenData) {
                throw new Exception("Token d'authentification invalide.");
            }
            
            // Vérifier que l'utilisateur a accès à l'administration
            if ($tokenData['service'] !== 'Admin') {
                throw new Exception("Accès non autorisé. Service Admin requis.");
            }
            
            // Récupérer la ressource ciblée et analyser l'URI
            $uri = $_SERVER["REQUEST_URI"];
            error_log("AdminController PUT: URI complète: " . $uri);
            
            // Vérifier si c'est une requête de mise à jour des permissions
            if (strpos($uri, '/api/admin/permissions/') !== false) {
                // Extraire le nom du service de l'URL
                $parts = explode('/api/admin/permissions/', $uri);
                $serviceName = urldecode(end($parts));
                
                error_log("AdminController PUT: Service extrait de l'URI: " . $serviceName);
                
                if (empty($serviceName)) {
                    throw new Exception("Nom du service non spécifié.");
                }
                
                // Récupérer les données de permissions
                $data = json_decode($request->getJson(), true);
                if (!isset($data['permissions']) || !is_array($data['permissions'])) {
                    throw new Exception("Données de permissions invalides.");
                }
                
                error_log("AdminController PUT: Permissions reçues: " . print_r($data['permissions'], true));
                
                // Mettre à jour les permissions
                $result = $this->permissions->updateServicePermissions($serviceName, $data['permissions']);
                
                if ($result) {
                    return [
                        'status' => 'success',
                        'message' => 'Permissions mises à jour avec succès'
                    ];
                } else {
                    throw new Exception("Erreur lors de la mise à jour des permissions.");
                }
            }
            
            throw new Exception("Ressource administrative non reconnue pour PUT: $uri");
        } catch (Exception $e) {
            error_log("AdminController Error (PUT): " . $e->getMessage());
            return [
                'status' => 'error',
                'message' => $e->getMessage()
            ];
        }
    }

// Améliorer la méthode processDeleteRequest
protected function processDeleteRequest(HttpRequest $request) {
    try {
        // Extraire le token des en-têtes HTTP
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? '';
        
        if (empty($authHeader) || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
            throw new Exception("Token d'authentification manquant ou invalide.");
        }
        
        // Vérifier le token avec le UserController
        $token = $matches[1];
        $tokenData = $this->userController->verifyTokenAndGetUser($token);
        
        if (!$tokenData) {
            throw new Exception("Token d'authentification invalide.");
        }
        
        // Vérifier que l'utilisateur a accès à l'administration
        if ($tokenData['service'] !== 'Admin') {
            throw new Exception("Accès non autorisé. Seul le service Admin peut effectuer cette action.");
        }
        
        // Récupérer la ressource ciblée
        $adminResource = $request->getId();
        
        // Supprimer un service
        if (strpos($adminResource, 'services/') === 0) {
            $serviceName = urldecode(substr($adminResource, strlen('services/')));
            
            if (empty($serviceName)) {
                throw new Exception("Nom de service non spécifié.");
            }
            
            $result = $this->users->deleteService($serviceName);
            
            return [
                'status' => 'success',
                'message' => "Le service '$serviceName' a été supprimé avec succès."
            ];
        }
        
        // Supprimer un emplacement
        if (strpos($adminResource, 'locations/') === 0) {
            $locationId = substr($adminResource, strlen('locations/'));
            
            if (empty($locationId)) {
                throw new Exception("ID d'emplacement non spécifié.");
            }
            
            $result = $this->locations->delete($locationId);
            
            if (!$result) {
                throw new Exception("Échec de la suppression de l'emplacement.");
            }
            
            return [
                'status' => 'success',
                'message' => "L'emplacement a été supprimé avec succès."
            ];
        }
        
        throw new Exception("Ressource non prise en charge pour la suppression.");
    } catch (Exception $e) {
        error_log("Erreur dans processDeleteRequest: " . $e->getMessage());
        return [
            'status' => 'error',
            'message' => $e->getMessage()
        ];
    }
}
}