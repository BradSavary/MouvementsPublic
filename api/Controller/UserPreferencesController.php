<?php
// filepath: c:\Users\bsavary\Desktop\code\mouvement-project\mouvement\api\Controller\PreferencesController.php
require_once "Controller.php";
require_once "Repository/UserPreferencesRepository.php";
require_once "Controller/UserController.php";
require_once "Repository/MouvementRepository.php";
require_once "Repository/DecesRepository.php";

class UserPreferencesController extends Controller {

    private UserPreferencesRepository $preferences;
    private UserController $userController;
    private MouvementRepository $mouvementRepository;
    private DecesRepository $decesRepository;

    public function __construct() {
        $this->preferences = new UserPreferencesRepository();
        $this->userController = new UserController();
        $this->mouvementRepository = new MouvementRepository();
        $this->decesRepository = new DecesRepository();
    }

    protected function processGetRequest(HttpRequest $request) {
        try {
            // Extraire le token des en-têtes HTTP
            $headers = getallheaders();
            $authHeader = $headers['Authorization'] ?? '';
            
            if (empty($authHeader) || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
                return [
                    "status" => "error",
                    "message" => "Token d'authentification manquant ou invalide"
                ];
            }
            
            // Vérifier le token avec le UserController
            $token = $matches[1];
            $tokenData = $this->userController->verifyTokenAndGetUser($token);
            
            if (!$tokenData) {
                return [
                    "status" => "error",
                    "message" => "Token d'authentification invalide"
                ];
            }
            
            $userId = $tokenData['id'];
            
            // Récupérer les statistiques pour le dashboard
            if ($request->getId() === 'stats') {
                $uncheckedMovements = $this->mouvementRepository->countUnvalidated();
                $uncheckedDeaths = $this->decesRepository->countUnvalidated();
                
                return [
                    "status" => "success",
                    "data" => [
                        "uncheckedMovements" => $uncheckedMovements,
                        "uncheckedDeaths" => $uncheckedDeaths,
                        "totalUnchecked" => $uncheckedMovements + $uncheckedDeaths
                    ]
                ];
            }

            // Récupérer les préférences de l'utilisateur
            $userPreferences = $this->preferences->find($userId);
            
            return [
                "status" => "success",
                "data" => $userPreferences
            ];
            
        } catch (Exception $e) {
            error_log("Erreur dans PreferencesController::processGetRequest: " . $e->getMessage());
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
                return [
                    "status" => "error",
                    "message" => "Token d'authentification manquant ou invalide"
                ];
            }
            
            // Vérifier le token avec le UserController
            $token = $matches[1];
            $tokenData = $this->userController->verifyTokenAndGetUser($token);
            
            if (!$tokenData) {
                return [
                    "status" => "error",
                    "message" => "Token d'authentification invalide"
                ];
            }
            
            $userId = $tokenData['id'];
            
            // Récupérer les données JSON
            $data = json_decode($request->getJson(), true);
            
            if (!isset($data['notification_type'])) {
                return [
                    "status" => "error",
                    "message" => "Le type de notification est requis"
                ];
            }
            
            // Valider le type de notification
            if (!in_array($data['notification_type'], ['never', 'death_only', 'all'])) {
                return [
                    "status" => "error",
                    "message" => "Type de notification invalide"
                ];
            }
            
            // Valider l'email si une notification est requise
            if ($data['notification_type'] !== 'never') {
                if (empty($data['email'])) {
                    return [
                        "status" => "error",
                        "message" => "L'email est requis pour les notifications"
                    ];
                }
                
                if (!preg_match('/^[a-zA-Z0-9._%+-]+@chimb\.fr$/', $data['email'])) {
                    return [
                        "status" => "error",
                        "message" => "L'adresse email doit être au format example@chimb.fr"
                    ];
                }
            }
            
            // Préparer les données pour la sauvegarde
            $preferencesData = [
                'user_id' => $userId,
                'notification_type' => $data['notification_type'],
                'email' => $data['notification_type'] !== 'never' ? $data['email'] : null,
                'theme' => $data['theme'] ?? 'light'
            ];
            
            // Sauvegarder les préférences
            $this->preferences->save($preferencesData);
            
            return [
                "status" => "success",
                "message" => "Préférences mises à jour avec succès",
                "data" => $preferencesData
            ];
            
        } catch (Exception $e) {
            error_log("Erreur dans PreferencesController::processPostRequest: " . $e->getMessage());
            return [
                "status" => "error",
                "message" => $e->getMessage()
            ];
        }
    }

    protected function processPutRequest(HttpRequest $request) {
        // Utiliser la même implémentation que le POST pour la mise à jour
        return $this->processPostRequest($request);
    }

    protected function processDeleteRequest(HttpRequest $request) {
        try {
            // Extraire le token des en-têtes HTTP
            $headers = getallheaders();
            $authHeader = $headers['Authorization'] ?? '';
            
            if (empty($authHeader) || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
                return [
                    "status" => "error",
                    "message" => "Token d'authentification manquant ou invalide"
                ];
            }
            
            // Vérifier le token avec le UserController
            $token = $matches[1];
            $tokenData = $this->userController->verifyTokenAndGetUser($token);
            
            if (!$tokenData) {
                return [
                    "status" => "error",
                    "message" => "Token d'authentification invalide"
                ];
            }
            
            $userId = $tokenData['id'];
            
            // Supprimer les préférences
            $this->preferences->delete($userId);
            
            return [
                "status" => "success",
                "message" => "Préférences réinitialisées avec succès"
            ];
            
        } catch (Exception $e) {
            error_log("Erreur dans PreferencesController::processDeleteRequest: " . $e->getMessage());
            return [
                "status" => "error",
                "message" => $e->getMessage()
            ];
        }
    }
}
?>