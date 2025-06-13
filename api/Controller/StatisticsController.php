<?php

require_once "Controller.php";
require_once "Repository/MouvementRepository.php";
require_once "Repository/DecesRepository.php";
require_once "Repository/LoginHistoryRepository.php";
require_once "Controller/UserController.php";

class StatisticsController extends Controller {
    
    private MouvementRepository $mouvementRepo;
    private DecesRepository $decesRepo;
    private LoginHistoryRepository $loginHistoryRepo;
    private UserController $userController;
    
    public function __construct() {
        $this->mouvementRepo = new MouvementRepository();
        $this->decesRepo = new DecesRepository();
        $this->loginHistoryRepo = new LoginHistoryRepository();
        $this->userController = new UserController();
    }
    
    protected function processGetRequest(HttpRequest $request) {
        try {
            // Extraire le token des en-têtes HTTP
            $headers = getallheaders();
            $authHeader = $headers['Authorization'] ?? '';
            
            if (empty($authHeader) || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
                throw new Exception("Authentification requise pour accéder aux statistiques");
            }
            
            // Vérifier le token avec le UserController
            $token = $matches[1];
            $tokenData = $this->userController->verifyTokenAndGetUser($token);
            
            if (!$tokenData) {
                throw new Exception("Token d'authentification invalide");
            }
            
            // Déterminer le type de statistiques demandées
            $statType = $request->getId();
            $fromDate = $request->getParam('fromDate') ?? date('Y-m-d', strtotime('-1 year'));
            
            switch ($statType) {
                case 'movements-by-type':
                    $result = $this->getMouvementsByType($fromDate);
                    break;
                case 'deaths-count':
                    $result = $this->getDeathsCount($fromDate);
                    break;
                case 'logins-count':
                    $result = $this->getLoginsCount($fromDate);
                    break;
                case 'user-logins':
                    $result = $this->getUserLogins($fromDate);
                    break;
                case 'upcoming-movements':
                    $result = $this->getUpcomingMovements();
                    break;
                case 'unvalidated-count':
                    $result = $this->getUnvalidatedCount();
                    break;
                case 'summary':
                    $result = $this->getSummary($fromDate);
                    break;
                default:
                    throw new Exception("Type de statistiques non reconnu");
            }
            
            return [
                "status" => "success",
                "data" => $result
            ];
            
        } catch (Exception $e) {
            return [
                "status" => "error",
                "message" => $e->getMessage()
            ];
        }
    }
    
    private function getMouvementsByType($fromDate) {
        // Requête SQL pour obtenir le nombre de mouvements par type
        $sql = $this->mouvementRepo->getStatsByType($fromDate);
        return $sql;
    }
    
    private function getDeathsCount($fromDate) {
        // Requête SQL pour obtenir le nombre de décès
        $sql = $this->decesRepo->getDeathsCount($fromDate);
        return $sql;
    }
    
    private function getLoginsCount($fromDate) {
        // Requête SQL pour obtenir le nombre de connexions
        $sql = $this->loginHistoryRepo->getLoginCount($fromDate);
        return $sql;
    }
    
    private function getUserLogins($fromDate) {
        // Requête SQL pour obtenir le nombre de connexions par utilisateur
        $sql = $this->loginHistoryRepo->getUserLoginCount($fromDate);
        return $sql;
    }
    
    private function getUpcomingMovements() {
        // Requête SQL pour obtenir les mouvements à venir
        $sql = $this->mouvementRepo->getUpcomingMovements();
        return $sql;
    }
    
    private function getUnvalidatedCount() {
        // Requête SQL pour obtenir le nombre de mouvements et décès non validés
        $mouvements = $this->mouvementRepo->countUnvalidated();
        $deces = $this->decesRepo->countUnvalidated();
        
        return [
            "movements" => $mouvements,
            "deaths" => $deces,
            "total" => $mouvements + $deces
        ];
    }
    
    private function getSummary($fromDate) {
        // Récupérer toutes les statistiques d'un coup pour la page de résumé
        return [
            "movementsByType" => $this->getMouvementsByType($fromDate),
            "deathsCount" => $this->getDeathsCount($fromDate),
            "loginsCount" => $this->getLoginsCount($fromDate),
            "topUsers" => $this->getUserLogins($fromDate),
            "upcomingMovements" => $this->getUpcomingMovements(),
            "unvalidatedCount" => $this->getUnvalidatedCount()
        ];
    }
    
    protected function processPostRequest(HttpRequest $request) {
        // Non utilisé pour les statistiques
        return ["status" => "error", "message" => "Méthode non supportée"];
    }
    
    protected function processDeleteRequest(HttpRequest $request) {
        // Non utilisé pour les statistiques
        return ["status" => "error", "message" => "Méthode non supportée"];
    }
    
    protected function processPutRequest(HttpRequest $request) {
        // Non utilisé pour les statistiques
        return ["status" => "error", "message" => "Méthode non supportée"];
    }
}