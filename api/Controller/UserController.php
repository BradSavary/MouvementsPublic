<?php

require_once "Controller.php";
require_once "Repository/UserRepository.php";
require_once "Repository/LoginHistoryRepository.php";

class UserController extends Controller {

    private UserRepository $users;
    private LoginHistoryRepository $loginHistory;
    private string $secretKey = "votre_clé_secrète_très_complexe_à_changer_en_production";
    private int $tokenExpiration = 3600; // 1 heure en secondes
    private $ldapServer = "ldap://10.84.15.1:389"; // LDAP server address
    private $ldapDomain = "hl-stleonard.fr"; // LDAP domain name 

    public function __construct() {
        $this->users = new UserRepository();
        $this->loginHistory = new LoginHistoryRepository();
    }

protected function processPostRequest(HttpRequest $request) {
    try {                
        // Récupère les données JSON envoyées par le frontend
        $data = json_decode($request->getJson(), true);
        $headers = getallheaders();
    
        // Vérifier si c'est une demande de vérification de token
        if (isset($data["action"]) && $data["action"] === "verify_token") {
            if (isset($data["token"])) {
                $userData = $this->verifyToken($data["token"]);
                if ($userData) {
                    return [
                        "status" => "success",
                        "data" => $userData
                    ];
                }
            }
            return [
                "status" => "error",
                "message" => "Token invalide ou expiré"
            ];
        }

        

    // Vérifier si c'est une demande d'ajout d'utilisateur (route user/add)
    if ($request->getId() === 'add') {
        // Vérifier l'authentification d'abord
        $authHeader = $headers['Authorization'] ?? '';
        if (empty($authHeader) || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
            throw new Exception("Authentification requise pour ajouter un utilisateur");
        }
        
            // Vérifier le token
            $token = $matches[1];
            $tokenData = $this->verifyTokenAndGetUser($token);
            
            if (!$tokenData || $tokenData['service'] !== 'Admin') {
                throw new Exception("Vous n'avez pas les permissions nécessaires pour ajouter un utilisateur");
            }
            
            // Valider les données requises
            if (!isset($data['username']) || !isset($data['password']) || !isset($data['service'])) {
                throw new Exception("Données d'utilisateur incomplètes");
            }
            
            // Vérifier si l'utilisateur existe déjà
            if ($this->users->userExists($data['username'])) {
                throw new Exception("Cet identifiant existe déjà");
            }
            
            // Ajouter l'utilisateur
            $username = $data['username'];
            $service = $data['service'];
            $password = password_hash($data['password'], PASSWORD_DEFAULT); // Hasher le mot de passe
            
            $success = $this->users->addUser($username, $service, $password);
            
            if (!$success) {
                throw new Exception("Erreur lors de l'ajout de l'utilisateur");
            }
            
            return [
                "status" => "success",
                "message" => "Utilisateur ajouté avec succès"
            ];
        }

        // Autrement, c'est une tentative de connexion
            $username = $data["username"] ?? null;
            $password = $data["password"] ?? null;

            if (!$username || !$password) {
                // Enregistrer une tentative échouée (informations manquantes)
                $this->loginHistory->addLoginRecord(
                    $username ?: 'unknown', 
                    false, 
                    $_SERVER['REMOTE_ADDR'] ?? null,
                    $_SERVER['HTTP_USER_AGENT'] ?? null,
                    "Nom d'utilisateur ou mot de passe manquant"
                );
                
                return [
                    "status" => "error",
                    "message" => "Nom d'utilisateur et mot de passe requis"
                ];
            }

            error_log("Tentative de connexion pour: $username");

            // Vérifier d'abord si l'utilisateur existe dans la base de données locale
            $user = $this->users->getByUsername($username);

            if ($user) {
                $passwordToCheck = $password;
                $storedHash = $user->getPassword();

                error_log("Tentative de vérification - Mot de passe fourni: " . $passwordToCheck);
                error_log("Tentative de vérification - Hash stocké: " . $storedHash);

                $isValid = password_verify($passwordToCheck, $storedHash);
                error_log("Résultat de password_verify(): " . ($isValid ? "SUCCÈS" : "ÉCHEC"));

                if ($isValid) {
                    // Authentification réussie avec la base de données locale
                    $token = $this->generateToken($user);
                    
                    // Enregistrer la connexion réussie
                    $this->loginHistory->addLoginRecord($username, true, $_SERVER['REMOTE_ADDR'], $_SERVER['HTTP_USER_AGENT']);
                    
                    return [
                        "status" => "success",
                        "message" => "Authentification réussie",
                        "token" => $token,
                        "username" => $user->getUsername(),
                        "service" => $user->getService()
                    ];
                }
            }

            // Si nous arrivons ici, l'authentification locale a échoué ou l'utilisateur n'existe pas
            // Essayer l'authentification LDAP
            $ldapResult = $this->authenticateWithLDAP($username, $password);
        
         if ($ldapResult["status"] === "success") {
                // Récupération ou création de l'utilisateur en base de données
                $userInfo = $ldapResult["userInfo"];
                $user = $this->processLdapUser($username, $password, $userInfo);
                
                if (!$user) {
                    // Enregistrer une tentative échouée (permissions insuffisantes)
                    $this->loginHistory->addLoginRecord(
                        $username,
                        false,
                        $_SERVER['REMOTE_ADDR'] ?? null,
                        $_SERVER['HTTP_USER_AGENT'] ?? null,
                        "Permissions insuffisantes pour accéder à l'application"
                    );
                    
                    return [
                        "status" => "error",
                        "message" => "Votre compte n'a pas les permissions nécessaires pour accéder à cette application"
                    ];
                }
            
            error_log("Utilisateur LDAP authentifié: $username avec service: " . $user->getService());
            
                // Enregistrer une connexion réussie
                $this->loginHistory->addLoginRecord(
                    $username,
                    true,
                    $_SERVER['REMOTE_ADDR'] ?? null,
                    $_SERVER['HTTP_USER_AGENT'] ?? null,
                    "Connexion réussie au service: " . $user->getService()
                );

            // Génère un token JWT
            $token = $this->generateToken($user);
            
            return [
                "status" => "success",
                "token" => $token,
                "username" => $user->getUsername(),
                "service" => $user->getService()  // Important : s'assurer que le service est inclus
            ];
        } else {
            // Enregistrer une tentative échouée (authentification LDAP)
                $this->loginHistory->addLoginRecord(
                    $username,
                    false,
                    $_SERVER['REMOTE_ADDR'] ?? null,
                    $_SERVER['HTTP_USER_AGENT'] ?? null,
                    "Échec d'authentification LDAP: " . ($ldapResult["message"] ?? "Erreur inconnue")
                );
            return [
                "status" => "error",
                "message" => $ldapResult["message"]
            ];
        }
    } catch (Exception $e) {
        // Enregistrer une erreur système
            if (isset($username)) {
                $this->loginHistory->addLoginRecord(
                    $username,
                    false,
                    $_SERVER['REMOTE_ADDR'] ?? null,
                    $_SERVER['HTTP_USER_AGENT'] ?? null,
                    "Erreur système: " . $e->getMessage()
                );
            }
        error_log("Erreur dans processPostRequest: " . $e->getMessage());
        return [
            "status" => "error",
            "message" => "Une erreur est survenue lors de l'authentification"
        ];
    }
}

// Ajoutez également l'implémentation de la méthode generateToken qui manque
private function generateToken($user) {
    // Créer les données du payload
    $issuedAt = time();
    $expirationTime = $issuedAt + $this->tokenExpiration;
    
    $payload = [
        'iat' => $issuedAt,           // Timestamp d'émission 
        'exp' => $expirationTime,     // Timestamp d'expiration
        'id' => $user->getId(),
        'username' => $user->getUsername(),
        'service' => $user->getService()  // S'assurer que le service est inclus
    ];
    
    // Convertir en JSON puis encoder en base64
    $jsonPayload = json_encode($payload);
    $base64Payload = base64_encode($jsonPayload);
    
    // Créer une signature
    $signature = hash_hmac('sha256', $base64Payload, $this->secretKey);
    
    // Combiner payload et signature pour créer le token final
    return $base64Payload . '.' . $signature;
}

// Implémentez également verifyToken si elle n'est pas déjà implémentée
private function verifyToken($token) {
    try {
        list($base64Payload, $signature) = explode('.', $token);
        
        // Vérifier la signature
        $expectedSignature = hash_hmac('sha256', $base64Payload, $this->secretKey);
        if (!hash_equals($expectedSignature, $signature)) {
            error_log("Signature de token invalide");
            return false;
        }
        
        // Décoder le payload
        $jsonPayload = base64_decode($base64Payload);
        $payload = json_decode($jsonPayload, true);
        
        // Vérifier l'expiration
        if (!isset($payload['exp']) || $payload['exp'] < time()) {
            error_log("Token expiré");
            return false;
        }
        
        // S'assurer que le service est inclus dans le payload retourné
        if (!isset($payload['service'])) {
            error_log("Token ne contient pas de service");
            $payload['service'] = null;
        }
        
        error_log("Token vérifié avec succès pour l'utilisateur: " . ($payload['username'] ?? 'inconnu') . " service: " . ($payload['service'] ?? 'inconnu'));
        
        return $payload;
    } catch (Exception $e) {
        error_log("Erreur lors de la vérification du token: " . $e->getMessage());
        return false;
    }
}

// Assurez-vous que determineUserService est complet 
private function determineUserService($username, $userInfo) {
    error_log("Détermination du service pour: $username");
    
    // 1. Utilisateurs du service "Accueil"
    $accueilUsers = [];
    if (in_array($username, $accueilUsers)) {
        error_log("$username attribué au service Accueil");
        return "Accueil";
    }
    
    // 2. Utilisateurs du service "Admin"
    $adminUsers = [];
    if (in_array($username, $adminUsers)) {
        error_log("$username attribué au service Admin");
        return "Admin";
    }
    
    // 3. Utilisateurs du service "Cadre de sante"
    $cadreUsers = [];
    if (in_array($username, $cadreUsers)) {
        error_log("$username attribué au service Cadre de Santé");
        return "Cadre de Santé";
    }
    
    // 4. Vérifier si la fonction contient "infirmier"
    $title = strtolower($userInfo['title'] ?? '');
    $description = strtolower($userInfo['description'] ?? '');
    $department = $userInfo['department'] ?? '';
    
    error_log("Analyse des attributs - Titre: $title, Description: $description, Département: $department");
    
    $isInfirmier = strpos($title, "infirmier") !== false || strpos($description, "infirmier") !== false;
    
    if ($isInfirmier) {
        error_log("Utilisateur identifié comme infirmier");
        
        // Attribution du service selon le service LDAP
        if ($department == "Medecine/soins paliatifs" || $department == "USLD") {
            error_log("$username attribué au service Medecine (basé sur le département)");
            return "Medecine";
        } else if ($department == "SSR" || $department == "SMR") {
            error_log("$username attribué au service SMR (basé sur le département)");
            return "SMR";
        } else if ($department == "EHPAD") {
            error_log("$username attribué au service EHPAD (basé sur le département)");
            return "EHPAD";
        }
    }
    
    error_log("Aucun service attribué pour: $username");
    return null;
}

protected function processGetRequest(HttpRequest $request) {
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
        $tokenData = $this->verifyTokenAndGetUser($token);
        
        if (!$tokenData) {
            return [
                "status" => "error",
                "message" => "Token invalide ou expiré"
            ];
        }
        
        // Vérifier si c'est une demande de permissions
        if ($request->getId() === 'permissions') {
            $userId = $request->getParam('userId');
            
            error_log("Demande de permissions pour l'utilisateur ID: $userId");
            
            // Récupérer l'utilisateur
            $user = $this->users->find($userId);
            if (!$user) {
                error_log("Utilisateur $userId non trouvé");
                return [
                    "status" => "error",
                    "message" => "Utilisateur non trouvé"
                ];
            }
            
            $service = $user->getService();
            error_log("Utilisateur trouvé: " . $user->getUsername() . ", Service: " . $service);
            
            // Récupérer les permissions personnalisées de l'utilisateur
            $userPermissions = $this->users->getUserPermissions($userId);
            $hasCustomPermissions = $this->users->hasCustomPermissions($userId);
            
            // Récupérer les permissions du service pour comparaison
            $servicePermissions = [];
            require_once "Repository/PermissionRepository.php";
            $permissionsRepo = new PermissionRepository();
            
            if ($service) {
                try {
                    $servicePermissions = $permissionsRepo->getServicePermissions($service);
                    error_log("Permissions du service $service récupérées: " . json_encode($servicePermissions));
                } catch (Exception $e) {
                    error_log("Erreur lors de la récupération des permissions du service: " . $e->getMessage());
                }
            }
            
            error_log("Permissions utilisateur pour $userId: " . json_encode($userPermissions));
            error_log("Permissions du service $service: " . json_encode($servicePermissions));
            error_log("L'utilisateur a des permissions personnalisées: " . ($hasCustomPermissions ? "Oui" : "Non"));
            
            return [
                "status" => "success",
                "data" => [
                    "userPermissions" => $userPermissions,
                    "servicePermissions" => $servicePermissions,
                    "hasCustomPermissions" => $hasCustomPermissions
                ]
            ];
        }
        
        // Récupérer les paramètres de pagination et de filtrage
        $page = (int)($request->getParam('page') ?? 1);
        $limit = (int)($request->getParam('limit') ?? 10);
        $serviceFilter = $request->getParam('service') ?? '';
        $searchQuery = $request->getParam('q') ?? '';
        
        // Valider les paramètres
        if ($page < 1) $page = 1;
        if ($limit < 1 || $limit > 100) $limit = 10;
        
        // Récupérer les utilisateurs avec pagination et filtres
        $result = $this->users->findAllPaginated($page, $limit, $serviceFilter, $searchQuery);
        
        return [
            "status" => "success",
            "data" => $result['items'],
            "totalPages" => $result['totalPages'],
            "currentPage" => $page
        ];
    } catch (Exception $e) {
        error_log("UserController Error: " . $e->getMessage());
        return [
            "status" => "error",
            "message" => "Erreur lors de la récupération des utilisateurs: " . $e->getMessage()
        ];
    }
}


     /**
     * Authentifie l'utilisateur avec LDAP
     */
    private function authenticateWithLDAP($username, $password) {
        try {
            $ldap_conn = ldap_connect($this->ldapServer);
            if (!$ldap_conn) {
                throw new Exception("Impossible de se connecter au serveur LDAP");
            }

            ldap_set_option($ldap_conn, LDAP_OPT_PROTOCOL_VERSION, 3);
            ldap_set_option($ldap_conn, LDAP_OPT_REFERRALS, 0);

            $ldap_bind = @ldap_bind($ldap_conn, "$username@$this->ldapDomain", $password);

            if ($ldap_bind) {
                // LDAP authentication successful
                $ldap_search_base = "dc=hl-stleonard,dc=fr";
                $ldap_search_filter = "(sAMAccountName=$username)";
                $ldap_attributes = array("givenName", "sn", "department", "title", "description");

                $ldap_search = ldap_search($ldap_conn, $ldap_search_base, $ldap_search_filter, $ldap_attributes);

                if ($ldap_search) {
                    $ldap_entries = ldap_get_entries($ldap_conn, $ldap_search);
                    if ($ldap_entries['count'] > 0) {
                        $userInfo = [
                            'prenom' => $ldap_entries[0]['givenname'][0] ?? '',
                            'nom' => $ldap_entries[0]['sn'][0] ?? '',
                            'department' => $ldap_entries[0]['department'][0] ?? '',
                            'title' => $ldap_entries[0]['title'][0] ?? '',
                            'description' => $ldap_entries[0]['description'][0] ?? ''
                        ];
                        
                        ldap_close($ldap_conn);
                        return [
                            "status" => "success",
                            "userInfo" => $userInfo
                        ];
                    }
                }
                
                ldap_close($ldap_conn);
                return [
                    "status" => "success",
                    "userInfo" => []
                ];
            } else {
                ldap_close($ldap_conn);
                return [
                    "status" => "error",
                    "message" => "Identifiant ou mot de passe incorrect"
                ];
            }
        } catch (Exception $e) {
            error_log("Erreur LDAP: " . $e->getMessage());
            return [
                "status" => "error",
                "message" => "Erreur de connexion au serveur LDAP: " . $e->getMessage()
            ];
        }
    }

      /**
     * Traite l'utilisateur LDAP et l'ajoute/met à jour en base de données
     */
    private function processLdapUser($username, $password, $userInfo) {
        try {
            // Vérifier si l'utilisateur existe déjà
            $existingUser = null;
            try {
                $existingUser = $this->users->getByUsername($username);
            } catch (Exception $e) {
                // Utilisateur non trouvé, on continue
            }
            
            if ($existingUser) {
                // L'utilisateur existe déjà, on le retourne simplement
                return $existingUser;
            }
            
            // Nouvel utilisateur, déterminer son service
            $service = $this->determineUserService($username, $userInfo);
            
            if (!$service) {
                // L'utilisateur n'a pas de service attribué, pas d'accès
                return null;
            }
            
            // Hasher le mot de passe pour le stockage
            $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
            
            // Ajouter l'utilisateur
            $this->users->addUser($username, $service, $hashedPassword);
            
            // Récupérer l'utilisateur nouvellement créé
            return $this->users->getByUsername($username);
        } catch (Exception $e) {
            error_log("Erreur lors du traitement de l'utilisateur LDAP: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Méthode publique pour vérifier un token et retourner les données utilisateur
     * Cette méthode est utilisée par d'autres contrôleurs pour l'authentification
     */
    public function verifyTokenAndGetUser($token) {
        try {
            $payload = $this->verifyToken($token);
            
            if (!$payload) {
                return false;
            }
            
            // Si nous avons l'identifiant utilisateur, vérifier qu'il existe toujours en base
            if (isset($payload['username'])) {
                $user = null;
                try {
                    $user = $this->users->getByUsername($payload['username']);
                } catch (Exception $e) {
                    error_log("Utilisateur du token introuvable: " . $e->getMessage());
                    return false;
                }
                
                if (!$user) {
                    error_log("Utilisateur du token introuvable");
                    return false;
                }
                
                // S'assurer que le service est correct (pourrait avoir changé depuis la création du token)
                $payload['service'] = $user->getService();
                
                error_log("Utilisateur vérifié: " . $payload['username'] . " avec service: " . $payload['service']);
            }
            
            return $payload;
        } catch (Exception $e) {
            error_log("Erreur lors de la vérification du token et de l'utilisateur: " . $e->getMessage());
            return false;
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
            $tokenData = $this->verifyTokenAndGetUser($token);
            
            if (!$tokenData) {
                throw new Exception("Token d'authentification invalide.");
            }
            
            // Vérifier que l'utilisateur est admin
            if ($tokenData['service'] !== 'Admin') {
                throw new Exception("Vous n'avez pas les droits pour supprimer un utilisateur");
            }
            
            // Récupérer l'ID de l'utilisateur à supprimer
            $userId = $request->getId();
            
            if (!$userId) {
                throw new Exception("ID utilisateur manquant");
            }
            
            // Supprimer l'utilisateur
            $user = $this->users->find($userId);
            
            if (!$user) {
                throw new Exception("Utilisateur non trouvé");
            }
            
            // Ne pas supprimer un utilisateur Admin
            if ($user->getService() === 'Admin') {
                throw new Exception("Les utilisateurs Admin ne peuvent pas être supprimés");
            }
            
            $this->users->delete($userId);
            
            return [
                'status' => 'success',
                'message' => "Utilisateur supprimé avec succès"
            ];
        } catch (Exception $e) {
            return [
                'status' => 'error',
                'message' => $e->getMessage()
            ];
        }
    }

    /**
 * Méthode publique pour récupérer un utilisateur par son nom d'utilisateur
 * Cette méthode est utilisée par d'autres contrôleurs
 */
public function getUserByUsername($username) {
    try {
        return $this->users->getByUsername($username);
    } catch (Exception $e) {
        error_log("Erreur dans getUserByUsername: " . $e->getMessage());
        return null;
    }
}

protected function processPutRequest(HttpRequest $request) {
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
        $tokenData = $this->verifyTokenAndGetUser($token);
        
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
                "message" => "Accès non autorisé"
            ];
        }
        
        // Traiter les différentes requêtes PUT
        if ($request->getId() === 'permissions') {
            $data = json_decode($request->getJson(), true);
            
            if (!isset($data['userId']) || !isset($data['permissions'])) {
                return [
                    "status" => "error",
                    "message" => "Données incomplètes"
                ];
            }
            
            // Mettre à jour les permissions de l'utilisateur
            $this->users->updateUserPermissions($data['userId'], $data['permissions']);
            
            return [
                "status" => "success",
                "message" => "Permissions mises à jour avec succès"
            ];
        }
        else if ($request->getId() === 'reset-permissions') {
            $data = json_decode($request->getJson(), true);
            
            if (!isset($data['userId'])) {
                return [
                    "status" => "error",
                    "message" => "ID utilisateur manquant"
                ];
            }
            
            // Réinitialiser les permissions personnalisées
            $this->users->resetUserPermissions($data['userId']);
            
            return [
                "status" => "success",
                "message" => "Permissions réinitialisées avec succès"
            ];
        }
        
        // Analyser le chemin de la requête
        $path = $request->getId();
        error_log("Chemin PUT reçu: " . $path);
        
        // Utiliser une route plus simple qui fonctionne mieux
        if ($path === 'update-service') {
            // Récupérer les données
            $data = json_decode($request->getJson(), true);
            
            if (!isset($data['userId']) || !isset($data['service']) || empty($data['service'])) {
                throw new Exception("L'ID de l'utilisateur et le nouveau service doivent être spécifiés.");
            }
            
            $userId = $data['userId'];
            $newService = $data['service'];
            
            // Vérifier si le service existe
            $services = $this->users->getAllServices();
            if (!in_array($newService, $services)) {
                throw new Exception("Le service spécifié n'existe pas.");
            }
            
            // Mettre à jour le service de l'utilisateur
            $result = $this->users->updateUserService($userId, $newService);
            
            if ($result) {
                return [
                    "status" => "success",
                    "message" => "Service de l'utilisateur mis à jour avec succès",
                ];
            } else {
                throw new Exception("Échec de la mise à jour du service de l'utilisateur.");
            }
        }
        
        throw new Exception("Route non reconnue pour la mise à jour. Chemin: " . $path);
        
    } catch (Exception $e) {
        error_log("Erreur dans processPutRequest: " . $e->getMessage());
        return [
            "status" => "error",
            "message" => $e->getMessage()
        ];
    }
}

public function checkUserPermission($userId, $permission) {
    try {
        require_once "Repository/PermissionRepository.php";
        $permissionsRepo = new PermissionRepository();
        
        // Récupérer l'utilisateur pour connaître son service
        $user = $this->users->find($userId);
        if (!$user) {
            return false;
        }
        
        // Vérifier si l'utilisateur a des permissions personnalisées
        $userPermissions = $this->users->getUserPermissions($userId);
        if (!empty($userPermissions)) {
            // Utiliser les permissions personnalisées
            return isset($userPermissions[$permission]) && $userPermissions[$permission];
        }
        
        // Sinon, utiliser les permissions du service
        $servicePermissions = $permissionsRepo->getServicePermissions($user->getService());
        return isset($servicePermissions[$permission]) && $servicePermissions[$permission];
        
    } catch (Exception $e) {
        error_log("Erreur dans UserController::checkUserPermission: " . $e->getMessage());
        return false;
    }
}



}
