<?php

require_once "Controller.php";
require_once "Repository/NoMovementDaysRepository.php";
require_once "Controller/UserController.php";
require_once "Repository/UserPreferencesRepository.php";
require_once "Repository/MouvementRepository.php";
require_once "Repository/DecesRepository.php";

class NoMovementDaysController extends Controller {

    private NoMovementDaysRepository $repository;
    private UserController $userController;
    private UserPreferencesRepository $preferencesRepo;
    private MouvementRepository $mouvements;
    private DecesRepository $deces;

    public function __construct() {
        $this->repository = new NoMovementDaysRepository();
        $this->userController = new UserController();
        $this->preferencesRepo = new UserPreferencesRepository();
        $this->mouvements = new MouvementRepository();
        $this->deces = new DecesRepository();
    }

    protected function processGetRequest(HttpRequest $request) {
        try {
            // Extraire le token des en-têtes HTTP
            $headers = getallheaders();
            $authHeader = $headers['Authorization'] ?? '';
            
            if (empty($authHeader) || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
                throw new Exception("Authentification requise");
            }
            
            // Vérifier le token avec le UserController
            $token = $matches[1];
            $tokenData = $this->userController->verifyTokenAndGetUser($token);
            
            if (!$tokenData) {
                throw new Exception("Token invalide");
            }
            
            // Si un ID est fourni (qui est une date dans ce cas)
            if ($request->getId()) {
                $date = $request->getId();
                $service = $request->getParam('service'); // Optionnel
                $noMovementDay = $this->repository->find($date, $service);
                
                if (!$noMovementDay) {
                    return [
                        "status" => "error",
                        "message" => "Jour sans mouvement non trouvé"
                    ];
                }
                
                return [
                    "status" => "success",
                    "data" => $noMovementDay
                ];
            }
            
            // Vérifier s'il y a un paramètre 'active' pour récupérer uniquement le jour actif
            if ($request->getParam('active') === 'true') {
                $activeNoMovementDays = $this->repository->findActive();
                
                return [
                    "status" => "success",
                    "data" => $activeNoMovementDays
                ];
            }
            
            // Sinon, retourner tous les jours sans mouvement
            $noMovementDays = $this->repository->findAll();
            
            return [
                "status" => "success",
                "data" => $noMovementDays
            ];
            
        } catch (Exception $e) {
            error_log("Erreur dans NoMovementDaysController::processGetRequest: " . $e->getMessage());
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
                throw new Exception("Authentification requise");
            }
            
            // Vérifier le token avec le UserController
            $token = $matches[1];
            $tokenData = $this->userController->verifyTokenAndGetUser($token);
            
            if (!$tokenData) {
                throw new Exception("Token invalide");
            }
            
            // Vérifier si l'utilisateur a la permission 'createMovement'
            $hasPermission = $this->userController->checkUserPermission($tokenData['id'], 'createMovement');
            if (!$hasPermission) {
                throw new Exception("Vous n'avez pas la permission de créer des jours sans mouvement");
            }
            
            // Récupérer les données
            $data = json_decode($request->getJson(), true);
            
            if (!isset($data['date']) || !isset($data['service'])) {
                throw new Exception("La date et le service sont requis");
            }
            
            if (!in_array($data['service'], ['SMR', 'EHPAD', 'Medecine'])) {
                throw new Exception("Le service doit être SMR, EHPAD ou Medecine");
            }
            
            // Ajouter les informations de l'utilisateur qui crée l'enregistrement
            $data['created_by'] = $tokenData['username'];
            
            // Sauvegarder l'enregistrement
            $result = $this->repository->save($data);
            
            if (!$result) {
                return [
                    "status" => "error",
                    "message" => "Ce jour sans mouvement existe déjà pour ce service"
                ];
            }
            
            // Envoyer les notifications par email
            $this->sendNotifications($data);
            
            return [
                "status" => "success",
                "message" => "Jour sans mouvement ajouté avec succès"
            ];
            
        } catch (Exception $e) {
            error_log("Erreur dans NoMovementDaysController::processPostRequest: " . $e->getMessage());
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
                throw new Exception("Authentification requise");
            }
            
            // Vérifier le token avec le UserController
            $token = $matches[1];
            $tokenData = $this->userController->verifyTokenAndGetUser($token);
            
            if (!$tokenData) {
                throw new Exception("Token invalide");
            }
            
            // Vérifier si l'utilisateur a la permission 'createMovement'
            $hasPermission = $this->userController->checkUserPermission($tokenData['id'], 'createMovement');
            if (!$hasPermission) {
                throw new Exception("Vous n'avez pas la permission de supprimer des jours sans mouvement");
            }
            
            // Récupérer la date et le service optionnel
            $date = $request->getId();
            $service = $request->getParam('service'); // Optionnel
            
            if (!$date) {
                throw new Exception("La date est requise");
            }
            
            // Supprimer l'enregistrement
            $result = $this->repository->delete($date, $service);
            
            if (!$result) {
                return [
                    "status" => "error",
                    "message" => "Jour sans mouvement non trouvé"
                ];
            }
            
            return [
                "status" => "success",
                "message" => "Jour sans mouvement supprimé avec succès"
            ];
            
        } catch (Exception $e) {
            error_log("Erreur dans NoMovementDaysController::processDeleteRequest: " . $e->getMessage());
            return [
                "status" => "error",
                "message" => $e->getMessage()
            ];
        }
    }

    protected function processPutRequest(HttpRequest $request) {
        // Non implémenté pour cette fonctionnalité
        return [
            "status" => "error",
            "message" => "Méthode non prise en charge"
        ];
    }
    
    /**
     * Envoie des notifications par email aux utilisateurs qui ont les préférences adéquates
     * @param array $noMovementData Les données du jour sans mouvement
     */
    private function sendNotifications($noMovementData) {
        try {
            // Récupérer les statistiques
            $uncheckedMovements = $this->mouvements->countUnvalidated();
            $uncheckedDeaths = $this->deces->countUnvalidated();
            $totalUnchecked = $uncheckedMovements + $uncheckedDeaths;
            
            // Récupérer seulement les utilisateurs qui ont choisi de recevoir des notifications pour tous les mouvements
            $recipients = $this->preferencesRepo->getNotificationRecipients('all');
            
            if (empty($recipients)) {
                return; // Pas de destinataires
            }
            
            // Formater la date pour l'affichage
            $dateObj = new DateTime($noMovementData['date']);
            $formattedDate = $dateObj->format('d/m/Y');
            
            $subject = "Jour sans mouvement - " . $formattedDate . " - " . $this->removeAccents($noMovementData['service']);
            
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
                    <h1>Jour sans mouvement enregistré</h1>
                    </div>
                    <div class='email-body'>
                    <p>Bonjour {$name},</p>
                    <p>Un jour sans mouvement a été signalé pour le <strong>{$formattedDate}</strong> dans le service <strong>{$noMovementData['service']}</strong> par <strong>{$noMovementData['created_by']}</strong>.</p>
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
                
                error_log("Email de notification de jour sans mouvement envoyé via commande mail à $to");
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