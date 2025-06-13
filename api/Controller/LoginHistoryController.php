<?php

require_once "Controller.php";
require_once "Repository/LoginHistoryRepository.php";
require_once "Controller/UserController.php";

class LoginHistoryController extends Controller {
    
    private LoginHistoryRepository $loginHistory;
    private UserController $userController;
    
    public function __construct() {
        $this->loginHistory = new LoginHistoryRepository();
        $this->userController = new UserController();
    }
    
    protected function processGetRequest(HttpRequest $request) {
        try {
            // Extraire le token des en-têtes HTTP
            $headers = getallheaders();
            $authHeader = $headers['Authorization'] ?? '';
            
            if (empty($authHeader) || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
                throw new Exception("Authentification requise pour accéder à l'historique des connexions");
            }
            
            // Vérifier le token avec le UserController
            $token = $matches[1];
            $tokenData = $this->userController->verifyTokenAndGetUser($token);
            
            if (!$tokenData) {
                throw new Exception("Token d'authentification invalide");
            }
            
            // Vérifier que l'utilisateur est admin
            if ($tokenData['service'] !== 'Admin') {
                throw new Exception("Accès restreint à l'administrateur");
            }
            
            // Récupérer les paramètres de pagination et de filtrage
            $page = (int)($request->getParam('page') ?? 1);
            $limit = (int)($request->getParam('limit') ?? 20);
            $username = $request->getParam('username') ?? '';
            $dateFrom = $request->getParam('dateFrom') ?? '';
            $dateTo = $request->getParam('dateTo') ?? '';
            $status = $request->getParam('status') ?? ''; // 'success' ou 'failed'
            
            // Valider les paramètres
            if ($page < 1) $page = 1;
            if ($limit < 1 || $limit > 100) $limit = 20;
            
            // Récupérer l'historique des connexions
            $history = $this->loginHistory->getLoginHistory(
                $page,
                $limit,
                $username,
                $dateFrom,
                $dateTo,
                $status
            );
            
            return [
                "status" => "success",
                "data" => $history
            ];
            
        } catch (Exception $e) {
            return [
                "status" => "error",
                "message" => $e->getMessage()
            ];
        }
    }
    
    protected function processPostRequest(HttpRequest $request) {
        // Non utilisé, mais requis par la classe mère
        return ["status" => "error", "message" => "Méthode non supportée"];
    }
    
    protected function processDeleteRequest(HttpRequest $request) {
        // Non utilisé, mais requis par la classe mère
        return ["status" => "error", "message" => "Méthode non supportée"];
    }
    
    protected function processPutRequest(HttpRequest $request) {
        // Non utilisé, mais requis par la classe mère
        return ["status" => "error", "message" => "Méthode non supportée"];
    }
}