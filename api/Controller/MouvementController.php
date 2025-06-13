<?php

require_once "Controller.php";
require_once "Repository/MouvementRepository.php";
require_once "Controller/UserController.php";
require_once "Repository/DecesRepository.php";

class MouvementController extends Controller {

    private MouvementRepository $mouvements;
    private UserController $userController;
    private UserRepository $users;
    private DecesRepository $deces;

    public function __construct() {
        $this->mouvements = new MouvementRepository(); // Cette ligne manquait
        $this->userController = new UserController();
        $this->users = new UserRepository();
        $this->deces = new DecesRepository();
    }

protected function processGetRequest(HttpRequest $request) {
    try {
        // Extraire le token des en-têtes HTTP
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? '';
        
        if (empty($authHeader) || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
            throw new Exception("Token d'authentification invalide");
        }
        
        // Vérifier le token avec le UserController
        $token = $matches[1];
        $tokenData = $this->userController->verifyTokenAndGetUser($token);
        
        if (!$tokenData) {
            throw new Exception("Token d'authentification invalide ou expiré");
        }
        
        // Récupérer les paramètres de pagination, de tri et de filtrage
        $page = (int)($request->getParam('page') ?? 1);
        $limit = (int)($request->getParam('limit') ?? 10);
        $sortOrder = $request->getParam('sort') ?? 'desc';
        $type = $request->getParam('type') ?? '';
        $dateFrom = $request->getParam('dateFrom') ?? '';
        $dateTo = $request->getParam('dateTo') ?? '';
        $filterService = $request->getParam('filterService') ?? '';
        $checkStatus = $request->getParam('checkStatus') ?? ''; 
        
        // Valider les paramètres
        if ($page < 1) $page = 1;
        if ($limit < 1 || $limit > 100) $limit = 10;
        if (!in_array($sortOrder, ['asc', 'desc'])) $sortOrder = 'desc';
        if (!in_array($checkStatus, ['', 'checked', 'unchecked'])) $checkStatus = '';

        // Vérifier si c'est une recherche
        $searchQuery = $request->getParam('q');
        
        // Récupérer l'ID de la ressource depuis la requête
        $id = $request->getId();
        
        // Si un ID est fourni, retourner ce mouvement spécifique
        if ($id) {
            $mouvement = $this->mouvements->find($id);
            if (!$mouvement) {
                throw new Exception("Mouvement non trouvé avec l'ID: $id");
            }
            
            return [
                'status' => 'success',
                'data' => $mouvement
            ];
        }
        
        // Sinon, retourner tous les mouvements paginés avec filtres
        $userService = $tokenData['service'];
        $serviceFilter = null;
        
        error_log("User Service: " . $userService);
        error_log("Filter Service: " . $filterService);
        
        // Si un service est spécifié dans le filtre et que l'utilisateur a le droit de filtrer par service
        if (!empty($filterService) && in_array($userService, ['Admin', 'Accueil', 'Cadre de Santé'])) {
            $serviceFilter = $filterService;
            error_log("Applying filter service: " . $serviceFilter);
        } 
        // Si l'utilisateur n'est pas Admin, Accueil ou Cadre de Santé, filtrer automatiquement par son service
        else if (!in_array($userService, ['Admin', 'Accueil', 'Cadre de Santé'])) {
            $serviceFilter = $userService;
            error_log("Applying automatic service filter: " . $serviceFilter);
        }
        
        // Récupérer les services disponibles pour le filtrage (uniquement pour les services privilégiés)
        $availableServices = [];
        if (in_array($userService, ['Admin', 'Accueil', 'Cadre de Santé'])) {
            try {
                // Récupérer tous les services depuis le UserRepository
                $availableServices = $this->users->getAllServices();
                error_log("Available services: " . json_encode($availableServices));
            } catch (Exception $e) {
                error_log("Erreur lors de la récupération des services: " . $e->getMessage());
            }
        }
        
        // Effectuer la recherche si demandée
        if ($searchQuery) {
            error_log("Performing search with query: " . $searchQuery);
            $result = $this->mouvements->search($searchQuery, $sortOrder, $page, $limit, $type, $dateFrom, $dateTo, $serviceFilter, $checkStatus);
        } else {
            error_log("Fetching all movements with filters");
            $result = $this->mouvements->findAll($sortOrder, $page, $limit, $type, $dateFrom, $dateTo, $serviceFilter, $checkStatus);
        }
        
        if (!$result) {
            throw new Exception("Erreur lors de la récupération des mouvements");
        }
        
        // Si c'est un utilisateur qui peut filtrer par service, ajouter la liste des services disponibles
        if (in_array($userService, ['Admin', 'Accueil', 'Cadre de Santé'])) {
            return [
                'status' => 'success',
                'data' => $result,
                'availableServices' => $availableServices
            ];
        }
        
        return [
            'status' => 'success',
            'data' => $result
        ];
        
    } catch (Exception $e) {
        error_log("Erreur dans processGetRequest: " . $e->getMessage());
        return [
            'status' => 'error',
            'message' => $e->getMessage()
        ];
    }
}
    
    /**
     * Extrait le service d'un utilisateur à partir de son nom d'utilisateur (author)
     */
    private function getServiceFromAuthor($author) {
        try {
            $user = $this->userController->getUserByUsername($author);
            return $user ? $user->getService() : null;
        } catch (Exception $e) {
            error_log("Erreur lors de la récupération du service pour l'auteur: " . $e->getMessage());
            return null;
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
            
            // Récupérer les données du mouvement
            $data = json_decode($request->getJson(), true);
            if (!$data) {
                throw new Exception("Données de mouvement invalides.");
            }
            
            // Vérifier si le type de mouvement est autorisé pour ce service
            if (!$this->canCreateMouvement($tokenData['service'], $data['type'])) {
                throw new Exception("Vous n'êtes pas autorisé à créer ce type de mouvement.");
            }
            
            // Ajouter l'auteur au mouvement
            $data['author'] = $tokenData['username'];
            
            // Créer et sauvegarder le mouvement
            $mouvement = $this->mouvements->createFromData($data);
            $this->mouvements->save($mouvement);
            $this->sendNotifications($mouvement);

            return [
                "status" => "success",
                "message" => "Mouvement créé avec succès",
                "data" => $mouvement
            ];
        } catch (Exception $e) {
            return [
                "status" => "error",
                "message" => $e->getMessage()
            ];
        }
    }
    
    /**
     * Vérifie si un utilisateur peut créer un type de mouvement selon son service
     */
    private function canCreateMouvement($service, $type) {
        // Service Admin peut tout faire
        if ($service === "Admin") {
            return true;
        }
        
        // Pour les autres services, vérifier dans la base de données
        try {
            // Inclure le repository de permissions s'il n'est pas déjà disponible
            require_once "Repository/PermissionRepository.php";
            $permissionRepo = new PermissionRepository();
            
            // Récupérer les permissions du service
            $permissions = $permissionRepo->getServicePermissions($service);
            
            // Vérifier si le service a la permission de créer des mouvements
            if (isset($permissions['createMovement']) && $permissions['createMovement']) {
                return true;
            }
            
            return false;
        } catch (Exception $e) {
            error_log("Erreur lors de la vérification des permissions: " . $e->getMessage());
            // En cas d'erreur, on refuse par sécurité
            return false;
        }
    }

protected function processDeleteRequest(HttpRequest $request) {
    try {
        // Extraire le token des en-têtes HTTP
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? '';
        
        if (empty($authHeader) || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
            return [
                "status" => "error",
                "message" => "Authentification requise"
            ];
        }
        
        // Vérifier le token avec le UserController
        $token = $matches[1];
        $tokenData = $this->userController->verifyTokenAndGetUser($token);
        
        if (!$tokenData) {
            return [
                "status" => "error",
                "message" => "Token invalide ou expiré"
            ];
        }
        
        // Vérifier que l'utilisateur est admin
        if ($tokenData['service'] !== 'Admin') {
            return [
                "status" => "error",
                "message" => "Vous n'avez pas les droits nécessaires pour effectuer cette action"
            ];
        }

        // Récupérer l'ID de la ressource 
        $id = $request->getId();
        
        // Gestion de la suppression d'archive basée sur l'âge
        if ($id === 'archives') {
            // Récupérer le paramètre d'âge (en mois)
            $ageMonths = (int)($request->getParam('months') ?? 0);
            
            if ($ageMonths <= 0) {
                return [
                    "status" => "error",
                    "message" => "Paramètre 'months' invalide. Doit être un nombre entier positif."
                ];
            }
            
            // Obtenir les informations utilisateur pour la journalisation
            $userId = $tokenData['id'] ?? 0;
            $username = $tokenData['username'] ?? 'admin';
            
            // Effectuer la suppression des archives avec les informations utilisateur
            $count = $this->mouvements->deleteOlderThan($ageMonths, $userId, $username);
            
            return [
                "status" => "success",
                "message" => "$count mouvements datant de plus de $ageMonths mois ont été supprimés",
                "count" => $count
            ];
        } 
        // Suppression d'un mouvement spécifique (code existant)
        else if ($id) {
            // Code existant pour la suppression d'un seul mouvement par ID
            if (!$this->canDeleteMouvement($tokenData['service'])) {
                return [
                    "status" => "error",
                    "message" => "Vous n'avez pas les droits nécessaires pour supprimer un mouvement"
                ];
            }
            
            if ($this->mouvements->delete($id)) {
                return [
                    "status" => "success",
                    "message" => "Mouvement supprimé avec succès"
                ];
            } else {
                return [
                    "status" => "error",
                    "message" => "Mouvement non trouvé ou impossible à supprimer"
                ];
            }
        }
        
        throw new Exception("Action non prise en charge");
    } catch (Exception $e) {
        error_log("Erreur dans processDeleteRequest: " . $e->getMessage());
        return [
            "status" => "error",
            "message" => $e->getMessage()
        ];
    }
}
    
    /**
     * Vérifie si un utilisateur peut supprimer un mouvement selon son service
     */
    private function canDeleteMouvement($service) {
        // Seul le service Admin peut supprimer des mouvements selon les permissions
        return $service === "Admin";
    }

    protected function processPutRequest(HttpRequest $request) {
        try {
            // Extraire le token des en-têtes HTTP
            $headers = getallheaders();
            $authHeader = $headers['Authorization'] ?? '';
            
            if (empty($authHeader) || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
                throw new Exception("Authentification requise.");
            }
            
            // Vérifier le token avec le UserController
            $token = $matches[1];
            $tokenData = $this->userController->verifyTokenAndGetUser($token);
            
            if (!$tokenData) {
                throw new Exception("Token d'authentification invalide.");
            }
            
            // Vérifier si l'utilisateur a la permission de cocher les mouvements
            $userService = $tokenData['service'];
            $username = $tokenData['username'];
            
            // Inclure le repository de permissions s'il n'est pas déjà disponible
            require_once "Repository/PermissionRepository.php";
            $permissionRepo = new PermissionRepository();
            
            // Vérifier la permission spécifique
            $permissions = $permissionRepo->getServicePermissions($userService);
            
            if ($userService !== 'Admin' && (!isset($permissions['checkMovement']) || !$permissions['checkMovement'])) {
                throw new Exception("Vous n'avez pas la permission de cocher/décocher des mouvements.");
            }
            
            // Récupérer l'ID de la ressource
            $id = $request->getId();
            
            if (!$id) {
                throw new Exception("ID du mouvement manquant.");
            }
            
            // Récupérer les données
            $data = json_decode($request->getJson(), true);
            
            if (!isset($data['checked'])) {
                throw new Exception("Statut de vérification manquant.");
            }
            
            $checked = (bool)$data['checked'];
            $checkedBy = $checked ? $username : null;
            
            // Mettre à jour le statut du mouvement
            $success = $this->mouvements->toggleChecked($id, $checked, $checkedBy);
            
            if (!$success) {
                throw new Exception("Échec de la mise à jour du statut du mouvement.");
            }
            
            return [
                "status" => "success",
                "message" => $checked ? "Mouvement marqué comme vérifié." : "Mouvement marqué comme non vérifié.",
                "data" => [
                    "id" => $id,
                    "checked" => $checked,
                    "checkedBy" => $checkedBy
                ]
            ];
            
        } catch (Exception $e) {
            return [
                "status" => "error",
                "message" => $e->getMessage()
            ];
        }
    }

/**
 * Vérifie si un utilisateur peut cocher/décocher un mouvement selon son service
 */
    private function canCheckMovement($service) {
        // Service Admin peut tout faire
        if ($service === "Admin") {
            return true;
        }
        
        // Pour les autres services, vérifier dans la base de données
        try {
            // Inclure le repository de permissions s'il n'est pas déjà disponible
            require_once "Repository/PermissionRepository.php";
            $permissionRepo = new PermissionRepository();
            
            // Récupérer les permissions du service
            $permissions = $permissionRepo->getServicePermissions($service);
            
            // Vérifier si le service a la permission de cocher des mouvements
            if (isset($permissions['checkMovement']) && $permissions['checkMovement']) {
                return true;
            }
            
            return false;
        } catch (Exception $e) {
            error_log("Erreur lors de la vérification des permissions: " . $e->getMessage());
            // En cas d'erreur, on refuse par sécurité
            return false;
        }
    }

private function sendNotifications($mouvement) {
    try {
        require_once "Repository/UserPreferencesRepository.php";
        $preferencesRepo = new UserPreferencesRepository();
        
        // Récupérer les statistiques
        $uncheckedMovements = $this->mouvements->countUnvalidated();
        $uncheckedDeaths = $this->deces->countUnvalidated();
        $totalUnchecked = $uncheckedMovements + $uncheckedDeaths;
        
        // Récupérer les destinataires pour les notifications "all"
        $recipients = $preferencesRepo->getNotificationRecipients('all');
        
        if (empty($recipients)) {
            return; // Pas de destinataires
        }
        
                $subject = "Nouveau mouvement ajoute - " . $this->removeAccents($mouvement->getNom() . " " . $mouvement->getPrenom());

        
        foreach ($recipients as $recipient) {
            $to = $recipient['email'];
            $name = $recipient['username'];
            
            // Créer le message HTML
             $htmlMessage = <<<HTML
                            <html>
                            <head>
                            <style>
                                body {font-family: Arial, sans-serif; background-color: #f9f9f9; color: #333;} 
                                .email-container {max-width: 600px; margin: 20px auto; background: #fff; border: 1px solid #ddd; border-radius: 8px;} 
                                .email-header {background: #633838; color: #fff; padding: 15px; text-align: center;} 
                                .email-body {padding: 15px;} 
                                .email-footer {background: #f1f1f1; text-align: center; padding: 10px; font-size: 12px;}
                            </style>
                            </head>
                            <body>
                            <div class='email-container'>
                                <div class='email-header'>
                                <h1>Nouveau Mouvement Enregistré</h1>
                                </div>
                                <div class='email-body'>
                                <p>Bonjour {$name},</p>
                                <p>Un nouveau mouvement a été enregistré, veuillez consulter le site des mouvements</p>
                                <p>
                                    <a href="http://10.84.15.15:83/" style="display:inline-block;padding:10px 20px;background:#633838;color:#fff;text-decoration:none;border-radius:4px; margin-top:10px; margin-bottom:10px;">
                                        Accéder au site des mouvements
                                    </a>
                                </p>
                                <p><strong>Statistiques actuelles:</strong></p>
                                <ul>
                                    <li>Mouvements non validés: {$uncheckedMovements}</li>
                                    <li>Décès non validés: {$uncheckedDeaths}</li>
                                    <li>Total à valider: {$totalUnchecked}</li>
                                </ul>
                                </div>
                                <div class='email-footer'>
                                <p>Cordialement,<br>Système d'information CHIMB</p>
                                </div>
                            </div>
                            </body>
                            </html>
            HTML;
            
            // Écrire le HTML dans un fichier temporaire
            $tmpFile = tempnam(sys_get_temp_dir(), 'mail_');
            file_put_contents($tmpFile, $htmlMessage);
            
            // Exécuter la commande mail avec l'en-tête Content-Type
              $command = "cat " . escapeshellarg($tmpFile) . " | mail -a 'Content-Type: text/html; charset=UTF-8' -a 'From: mouvement@chimb.fr' -s " . 
                      escapeshellarg($subject) . " " . escapeshellarg($to);
            
            $result = shell_exec($command);
            
            // Nettoyer
            @unlink($tmpFile);
            
            error_log("Email de notification de mouvement envoyé via commande mail à $to");
        }
    } catch (Exception $e) {
        error_log("Erreur lors de l'envoi des notifications: " . $e->getMessage());
    }
}


/**
 * Fonction pour supprimer les accents et caractères spéciaux
 */
private function removeAccents($string) {
    $unwanted_array = [
        'é'=>'e', 'è'=>'e', 'ê'=>'e', 'ë'=>'e', 'ć'=>'c', 'ç'=>'c', 'à'=>'a', 'â'=>'a', 'á'=>'a',
        'î'=>'i', 'ï'=>'i', 'í'=>'i', 'ì'=>'i', 'ô'=>'o', 'ö'=>'o', 'ò'=>'o', 'ó'=>'o',
        'ù'=>'u', 'û'=>'u', 'ü'=>'u', 'ú'=>'u', 'ÿ'=>'y', 'ñ'=>'n',
        'É'=>'E', 'È'=>'E', 'Ê'=>'E', 'Ë'=>'E', 'Ć'=>'C', 'Ç'=>'C', 'À'=>'A', 'Â'=>'A', 'Á'=>'A',
        'Î'=>'I', 'Ï'=>'I', 'Í'=>'I', 'Ì'=>'I', 'Ô'=>'O', 'Ö'=>'O', 'Ò'=>'O', 'Ó'=>'O',
        'Ù'=>'U', 'Û'=>'U', 'Ü'=>'U', 'Ú'=>'U', 'Ÿ'=>'Y', 'Ñ'=>'N'
    ];
    return strtr($string, $unwanted_array);
}






}