<?php

require_once "Controller.php";
require_once "Repository/DecesRepository.php";
require_once "Controller/UserController.php";

class DecesController extends Controller {

    private DecesRepository $deces;
    private UserController $userController;

    public function __construct() {
        $this->deces = new DecesRepository();
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
            
            // Récupérer les paramètres de pagination, de tri et de filtrage
            $page = (int)($request->getParam('page') ?? 1);
            $limit = (int)($request->getParam('limit') ?? 10);
            $sortOrder = $request->getParam('sort') ?? 'desc';
            $dateFrom = $request->getParam('dateFrom') ?? '';
            $dateTo = $request->getParam('dateTo') ?? '';
            $checkStatus = $request->getParam('checkStatus') ?? ''; // Récupérer le paramètre de statut
            
            // Valider les paramètres
            if ($page < 1) $page = 1;
            if ($limit < 1 || $limit > 100) $limit = 10;
            if (!in_array($sortOrder, ['asc', 'desc'])) $sortOrder = 'desc';
            if (!in_array($checkStatus, ['', 'checked', 'unchecked'])) $checkStatus = ''; // Valider le paramètre
            
            // Vérifier si c'est une recherche
            $searchQuery = $request->getParam('q');
            
            // Récupérer l'ID de la ressource depuis la requête
            $id = $request->getId();
            
            // Si un ID est fourni, retourner ce décès spécifique
            if ($id) {
                $deces = $this->deces->find($id);
                
                if (!$deces) {
                    return [
                        'status' => 'error',
                        'message' => 'Décès non trouvé'
                    ];
                }
                
                return [
                    'status' => 'success',
                    'data' => $deces
                ];
            }
            
            // Sinon, retourner tous les décès paginés avec filtres
            $userService = $tokenData['service'];
            $serviceFilter = null;
            
            // Si l'utilisateur n'est pas Admin ou Accueil, filtrer par son service
            if ($userService !== 'Admin' && $userService !== 'Accueil') {
                $serviceFilter = $userService;
            }
            
            // Si une recherche est demandée
            if ($searchQuery) {
                $result = $this->deces->search($searchQuery, $sortOrder, $page, $limit, $dateFrom, $dateTo, $serviceFilter, $checkStatus);
            } else {
                $result = $this->deces->findAll($sortOrder, $page, $limit, $dateFrom, $dateTo, $serviceFilter, $checkStatus);
            }
            
            return [
                'status' => 'success',
                'data' => $result['items'],
                'totalPages' => $result['totalPages'],
                'currentPage' => $result['currentPage'],
                'totalItems' => $result['totalItems'] ?? count($result['items'])
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
            
            // Récupérer les données du décès
            $data = json_decode($request->getJson(), true);
            if (!$data) {
                throw new Exception("Données invalides.");
            }
            
            // Vérifier si l'utilisateur a la permission d'enregistrer un décès
            if (!$this->canCreateDeathRecord($tokenData['service'])) {
                throw new Exception("Vous n'avez pas les permissions nécessaires pour enregistrer un décès.");
            }
            
            // Ajouter l'auteur au décès
            $data['author'] = $tokenData['username'];
            
            // Créer et sauvegarder le décès
            $deces = $this->deces->createFromData($data);
            $this->deces->save($deces);

            //Envoie d'un email
            $this->sendNotifications($deces);
            
            return [
                "status" => "success",
                "message" => "Décès enregistré avec succès."
            ];
        } catch (Exception $e) {
            return [
                "status" => "error",
                "message" => $e->getMessage()
            ];
        }
    }
    
    /**
     * Vérifie si un utilisateur peut créer un enregistrement de décès selon son service
     */
    private function canCreateDeathRecord($service) {
        // Service Admin et Cadre de Santé peuvent enregistrer des décès
        return in_array($service, ["Admin", "Cadre de Santé"]);
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
            
            // Vérifier si l'utilisateur a la permission de supprimer des décès
            if (!$this->canDeleteDeathRecord($tokenData['service'])) {
                throw new Exception("Vous n'avez pas les permissions nécessaires pour supprimer un décès.");
            }
            
            // Récupérer l'ID du décès à supprimer
            $id = $request->getId();
            if (!$id) {
                throw new Exception("ID de décès manquant.");
            }
            
            // Vérifier si le décès existe
            $deces = $this->deces->find($id);
            if (!$deces) {
                throw new Exception("Décès non trouvé.");
            }
            
            // Supprimer le décès
            $result = $this->deces->delete($id);
            
            if ($result) {
                return [
                    "status" => "success",
                    "message" => "Décès supprimé avec succès."
                ];
            } else {
                throw new Exception("Erreur lors de la suppression du décès.");
            }
        } catch (Exception $e) {
            return [
                "status" => "error",
                "message" => $e->getMessage()
            ];
        }
    }
    
    /**
     * Vérifie si un utilisateur peut supprimer un enregistrement de décès selon son service
     */
    private function canDeleteDeathRecord($service) {
        // Seul le service Admin peut supprimer des décès
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
                throw new Exception("Vous n'avez pas la permission de cocher/décocher des décès.");
            }
            
            // Récupérer l'ID de la ressource
            $id = $request->getId();
            
            if (!$id) {
                throw new Exception("ID du décès manquant.");
            }
            
            // Récupérer les données
            $data = json_decode($request->getJson(), true);
            
            if (!isset($data['checked'])) {
                throw new Exception("Statut de vérification manquant.");
            }
            
            $checked = (bool)$data['checked'];
            $checkedBy = $checked ? $username : null;
            
            // Mettre à jour le statut du décès
            $success = $this->deces->toggleChecked($id, $checked, $checkedBy);
            
            if (!$success) {
                throw new Exception("Échec de la mise à jour du statut du décès.");
            }
            
            return [
                "status" => "success",
                "message" => $checked ? "Décès marqué comme vérifié." : "Décès marqué comme non vérifié.",
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
     * Vérifie si un utilisateur peut cocher/décocher un décès selon son service
     */
    private function canCheckDeath($service) {
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
            
            // Vérifier si le service a la permission de cocher des décès
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

private function sendNotifications($deces) {
    try {
        require_once "Repository/UserPreferencesRepository.php";
        require_once "Repository/MouvementRepository.php";
        
        $preferencesRepo = new UserPreferencesRepository();
        $mouvementRepo = new MouvementRepository();
        
        // Récupérer les statistiques
        $uncheckedMovements = $mouvementRepo->countUnvalidated();
        $uncheckedDeaths = $this->deces->countUnvalidated();
        $totalUnchecked = $uncheckedMovements + $uncheckedDeaths;
        
        // Récupérer les destinataires pour les notifications de type "death_only" et "all"
        $recipientsDeathOnly = $preferencesRepo->getNotificationRecipients('death_only');
        $recipientsAll = $preferencesRepo->getNotificationRecipients('all');
        // Fusionner et supprimer les doublons par email
        $recipients = [];
        $emails = [];
        foreach (array_merge($recipientsDeathOnly, $recipientsAll) as $recipient) {
            if (!in_array($recipient['email'], $emails)) {
            $recipients[] = $recipient;
            $emails[] = $recipient['email'];
            }
        }
        
        if (empty($recipients)) {
            return; // Pas de destinataires
        }
        
        $subject = "Nouveau deces ajoute - " . $this->removeAccents($deces->getNom() . " " . $deces->getPrenom());
        
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
                                <h1>Nouveau Décès Enregistré</h1>
                                </div>
                                <div class='email-body'>
                                <p>Bonjour {$name},</p>
                                <p>Un nouveau décès a été enregistré,<strong> veuillez consulter le site des mouvements et le traiter</strong></p>
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
            
            // Exécuter la commande mail avec l'en-tête Content-Type mais SANS UTF-8 dans les entêtes
            $command = "cat " . escapeshellarg($tmpFile) . " | mail -a 'Content-Type: text/html; charset=UTF-8' -a 'From: mouvement@chimb.fr' -s " . 
                      escapeshellarg($subject) . " " . escapeshellarg($to);
            
            $result = shell_exec($command);
            
            // Nettoyer
            @unlink($tmpFile);
            
            error_log("Email de notification de décès envoyé via commande mail à $to");
        }
    } catch (Exception $e) {
        error_log("Erreur lors de l'envoi des notifications de décès: " . $e->getMessage());
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

