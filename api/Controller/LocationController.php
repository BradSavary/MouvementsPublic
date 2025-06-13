<?php

require_once "Controller.php";
require_once "Repository/LocationRepository.php";
require_once "Controller/UserController.php";

class LocationController extends Controller {

    private LocationRepository $locations;
    private UserController $userController;

    public function __construct() {
        $this->locations = new LocationRepository();
        $this->userController = new UserController();
    }

    protected function processGetRequest(HttpRequest $request) {
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
            
            // Vérifier si une pagination est demandée
            $page = (int)($request->getParam('page') ?? 1);
            $limit = (int)($request->getParam('limit') ?? 10);
            $type = $request->getParam('type') ?? '';
            $searchQuery = $request->getParam('q') ?? '';
            $mode = $request->getParam('mode') ?? 'normal';
            
            // En mode admin, renvoyer les données paginées
            if ($mode === 'admin') {
                // Vérifier si l'utilisateur est admin
                if ($tokenData['service'] !== 'Admin') {
                    throw new Exception("Accès non autorisé à cette ressource.");
                }
                
                $result = $this->locations->findAllPaginated($page, $limit, $type, $searchQuery);
                
                return [
                    "status" => "success",
                    "data" => $result
                ];
            } else {
                // Mode normal - pour les sélecteurs de formulaire
                $allLocations = $this->locations->findAll();
                $rooms = $this->locations->findAllRooms();
                $facilities = $this->locations->findAllFacilities();
                
                return [
                    "status" => "success",
                    "data" => [
                        "all" => $allLocations,
                        "rooms" => $rooms,
                        "facilities" => $facilities
                    ]
                ];
            }
        } catch (Exception $e) {
            return [
                "status" => "error",
                "message" => $e->getMessage()
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
            
            // // Vérifier que l'utilisateur est admin
            // if ($tokenData['service'] !== 'Admin') {
            //     throw new Exception("Seuls les administrateurs peuvent ajouter des emplacements.");
            // }
            
            // Récupérer les données
        $data = json_decode($request->getJson(), true);
        
         if (!isset($data['name']) || !isset($data['type'])) {
            throw new Exception("Données manquantes pour créer l'emplacement.");
        }
        
        // Récupérer le service et la section si fournis
        $service = $data['service'] ?? null;
        $section = $data['section'] ?? null;
        
        // Ajouter l'emplacement avec son service et sa section
        $this->locations->addLocation($data['name'], $data['type'], $service, $section);
        
        return [
            'status' => 'success',
            'message' => 'Emplacement ajouté avec succès'
        ];
        
    } catch (Exception $e) {
            return [
                "status" => "error",
                "message" => $e->getMessage()
            ];
        }
    }
    
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
            
            // Vérifier que l'utilisateur est admin
            if ($tokenData['service'] !== 'Admin') {
                throw new Exception("Seuls les administrateurs peuvent supprimer des emplacements.");
            }
            
            // Récupérer l'ID de l'emplacement à supprimer
            $locationId = $request->getId();
            
            if (!$locationId) {
                throw new Exception("ID d'emplacement non spécifié.");
            }
            
            // Supprimer l'emplacement
            $result = $this->locations->delete($locationId);
            
            if (!$result) {
                throw new Exception("Emplacement non trouvé ou erreur lors de la suppression.");
            }
            
            return [
                "status" => "success",
                "message" => "Emplacement supprimé avec succès"
            ];
        } catch (Exception $e) {
            return [
                "status" => "error",
                "message" => $e->getMessage()
            ];
        }
    }
}