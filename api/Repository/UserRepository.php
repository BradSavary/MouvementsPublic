<?php
require_once "Repository/EntityRepository.php";
require_once "Class/User.php";


class UserRepository extends EntityRepository {

    public function __construct() {
        parent::__construct();
    }

 public function addUser($username, $service, $password) {
    try {
        // Vérifier si l'utilisateur existe déjà
        if ($this->userExists($username)) {
            throw new Exception("Un utilisateur avec ce nom existe déjà");
        }
        
        // Préparer et exécuter la requête SQL
        $sql = $this->cnx->prepare('INSERT INTO user (username, service, password) VALUES (:username, :service, :password)');
        
        $sql->bindParam(':username', $username);
        $sql->bindParam(':service', $service);
        $sql->bindParam(':password', $password);
        
        return $sql->execute();
    } catch (PDOException $e) {
        error_log("Erreur SQL dans addUser: " . $e->getMessage());
        throw new Exception("Erreur lors de l'ajout de l'utilisateur: " . $e->getMessage());
    }
}

    public function getByUsername($username) {
        try {
            $sql = $this->cnx->prepare('SELECT * FROM user WHERE username = :username');
            $sql->bindParam(':username', $username);
            $sql->execute();
            $result = $sql->fetch(PDO::FETCH_ASSOC);
            
            if (!$result) {
                return null;
            }
            
            // Créer un objet User à partir des données retournées
            $user = new User($result['id']);
            $user->setUsername($result['username']);
            $user->setService($result['service']);
            $user->setPassword($result['password']);

            error_log("getByUsername: Recherche de l'utilisateur $username");
            if ($result) {
                error_log("getByUsername: Utilisateur trouvé avec mot de passe: " . substr($result['password'], 0, 10) . "...");
                error_log("getByUsername: Le mot de passe est hashé: " . (password_get_info($result['password'])['algo'] ? 'Oui' : 'Non'));
            } else {
                error_log("getByUsername: Utilisateur non trouvé");
            }
            
            return $user;
        } catch (PDOException $e) {
            error_log("Erreur SQL dans getByUsername: " . $e->getMessage());
            throw new Exception("Erreur lors de la recherche de l'utilisateur: " . $e->getMessage());
        }
    }

    public function find($id) {
        try {
            $sql = $this->cnx->prepare('SELECT * FROM user WHERE id = :id');
            $sql->bindParam(':id', $id);
            $sql->execute();
            $result = $sql->fetch(PDO::FETCH_ASSOC);
            
            if (!$result) {
                return null;
            }
            
            // Créer un objet User à partir des données retournées
            $user = new User($result['id']);
            $user->setUsername($result['username']);
            $user->setService($result['service']);
            $user->setPassword($result['password']);
            
            return $user;
        } catch (PDOException $e) {
            error_log("Erreur SQL dans find: " . $e->getMessage());
            throw new Exception("Erreur lors de la recherche de l'utilisateur: " . $e->getMessage());
        }
    }
    
    public function findAll() {
        $sql = $this->cnx->prepare('SELECT id, username, service FROM user');
        $sql->execute();
        $result = $sql->fetchAll(PDO::FETCH_OBJ);
        return $result;
    }
    
    public function save($empty) {

    }

    public function delete($id) {
        try {
            $sql = $this->cnx->prepare('DELETE FROM user WHERE id = :id');
            $sql->bindParam(':id', $id);
            $sql->execute();
            return $sql->rowCount() > 0;
        } catch (PDOException $e) {
            error_log("Erreur SQL dans delete: " . $e->getMessage());
            throw new Exception("Erreur lors de la suppression de l'utilisateur: " . $e->getMessage());
        }
    }
    
    public function update($empty) {

    }

    /**
     * Récupérer tous les services disponibles
     */
    public function getAllServices() {
        try {
            $sql = $this->cnx->prepare('SELECT DISTINCT service FROM user ORDER BY service');
            $sql->execute();
            $results = $sql->fetchAll(PDO::FETCH_COLUMN);
            return $results;
        } catch (PDOException $e) {
            error_log("Erreur SQL dans getAllServices: " . $e->getMessage());
            throw new Exception("Erreur lors de la récupération des services: " . $e->getMessage());
        }
    }


   /**
     * Ajouter un nouveau service
     */
    public function addService($serviceName) {
        try {
            // Vérifier si le service existe déjà
            $sql = $this->cnx->prepare('SELECT COUNT(*) FROM user WHERE service = :service');
            $sql->bindParam(':service', $serviceName);
            $sql->execute();
            
            if ($sql->fetchColumn() > 0) {
                throw new Exception("Ce service existe déjà.");
            }
            
            // Créer un utilisateur temporaire avec ce service pour qu'il soit disponible
            // En pratique, vous voudrez peut-être une table dédiée aux services
            $sql = $this->cnx->prepare('INSERT INTO user (username, service, password) VALUES (:username, :service, :password)');
            
            $tempUsername = "temp_" . strtolower(str_replace(' ', '_', $serviceName)) . "_" . time();
            $tempPassword = password_hash(uniqid(), PASSWORD_DEFAULT);
            
            $sql->bindParam(':username', $tempUsername);
            $sql->bindParam(':service', $serviceName);
            $sql->bindParam(':password', $tempPassword);
            
            return $sql->execute();
        } catch (PDOException $e) {
            error_log("Erreur SQL dans addService: " . $e->getMessage());
            throw new Exception("Erreur lors de l'ajout du service: " . $e->getMessage());
        }
    }
 /**
 * Supprimer un service
 */
public function deleteService($serviceName) {
    try {
        // Vérifier si le service existe et qu'il n'est pas "Admin" (pour éviter de supprimer le service Admin)
        $checkSql = $this->cnx->prepare('SELECT COUNT(*) FROM user WHERE service = :service');
        $checkSql->bindParam(':service', $serviceName);
        $checkSql->execute();
        
        if ($checkSql->fetchColumn() == 0) {
            throw new Exception("Le service n'existe pas.");
        }
        
        if ($serviceName === "Admin") {
            throw new Exception("Le service Admin ne peut pas être supprimé.");
        }
        
        // Supprimer toutes les permissions associées à ce service
        $deletePerm = $this->cnx->prepare('DELETE FROM service_permissions WHERE service_name = :service');
        $deletePerm->bindParam(':service', $serviceName);
        $deletePerm->execute();
        
        
        // Supprimer les utilisateurs du service (attention, cela supprime définitivement les utilisateurs)
        $deleteUsers = $this->cnx->prepare('DELETE FROM user WHERE service = :service');
        $deleteUsers->bindParam(':service', $serviceName);
        $deleteUsers->execute();
        
        return true;
    } catch (PDOException $e) {
        error_log("Erreur SQL dans deleteService: " . $e->getMessage());
        throw new Exception("Erreur lors de la suppression du service: " . $e->getMessage());
    }
}

public function userExists($username) {
    try {
        $sql = $this->cnx->prepare('SELECT COUNT(*) FROM user WHERE username = :username');
        $sql->bindParam(':username', $username);
        $sql->execute();
        return $sql->fetchColumn() > 0;
    } catch (PDOException $e) {
        error_log("Erreur SQL dans userExists: " . $e->getMessage());
        throw new Exception("Erreur lors de la vérification de l'existence de l'utilisateur: " . $e->getMessage());
    }
}


public function findAllPaginated($page = 1, $limit = 10, $serviceFilter = '', $searchQuery = '') {
    try {
        // Calculer l'offset pour la pagination
        $offset = ($page - 1) * $limit;
        
        // Construction de la requête avec conditions de filtrage
        $query = "SELECT id, username, service FROM user WHERE 1=1";
        $params = [];
        
        // Filtre par service si fourni
        if (!empty($serviceFilter)) {
            $query .= " AND service = :service";
            $params[':service'] = $serviceFilter;
        }
        
        // Filtre par recherche si fournie
        if (!empty($searchQuery)) {
            $query .= " AND (username LIKE :search)";
            $params[':search'] = "%$searchQuery%";
        }
        
        // Tri et pagination
        $query .= " ORDER BY username ASC LIMIT :limit OFFSET :offset";
        
        // Préparer et exécuter la requête principale
        $sql = $this->cnx->prepare($query);
        
        // Lier les paramètres de filtrage
        foreach ($params as $key => $value) {
            $sql->bindValue($key, $value);
        }
        
        $sql->bindValue(':limit', $limit, PDO::PARAM_INT);
        $sql->bindValue(':offset', $offset, PDO::PARAM_INT);
        $sql->execute();
        $results = $sql->fetchAll(PDO::FETCH_ASSOC);
        
        // Requête pour compter le nombre total d'éléments (avec les mêmes filtres)
        $countQuery = "SELECT COUNT(*) as total FROM user WHERE 1=1";
        
        if (!empty($serviceFilter)) {
            $countQuery .= " AND service = :service";
        }
        
        if (!empty($searchQuery)) {
            $countQuery .= " AND (username LIKE :search)";
        }
        
        $countSql = $this->cnx->prepare($countQuery);
        
        // Lier les paramètres de filtrage pour la requête de comptage
        foreach ($params as $key => $value) {
            $countSql->bindValue($key, $value);
        }
        
        $countSql->execute();
        $total = (int)$countSql->fetchColumn();
        
        // Calculer le nombre total de pages
        $totalPages = ceil($total / $limit);
        
        return [
            'items' => $results,
            'totalPages' => $totalPages,
            'currentPage' => $page
        ];
    } catch (PDOException $e) {
        error_log("Erreur SQL dans findAllPaginated: " . $e->getMessage());
        throw new Exception("Erreur lors de la récupération des utilisateurs: " . $e->getMessage());
    }
}

public function updateUserService($userId, $newService) {
    try {
        // Vérifier que l'utilisateur existe
        $checkSql = $this->cnx->prepare('SELECT COUNT(*), service FROM user WHERE id = :id');
        $checkSql->bindParam(':id', $userId);
        $checkSql->execute();
        $result = $checkSql->fetch(PDO::FETCH_ASSOC);
        
        if (!$result || $result['COUNT(*)'] == 0) {
            throw new Exception("Utilisateur non trouvé.");
        }
        
        // Vérifier si c'est un administrateur (ne pas permettre de changer un admin)
        $currentService = $result['service'];
        if ($currentService === 'Admin' && $newService !== 'Admin') {
            throw new Exception("Impossible de modifier le service d'un administrateur. Veuillez le modifier dans la base de données si nécessaire.");
        }
        
        // Mettre à jour le service de l'utilisateur
        $sql = $this->cnx->prepare('UPDATE user SET service = :service WHERE id = :id');
        $sql->bindParam(':service', $newService);
        $sql->bindParam(':id', $userId);
        $sql->execute();
        
        return $sql->rowCount() > 0;
    } catch (PDOException $e) {
        error_log("Erreur SQL dans updateUserService: " . $e->getMessage());
        throw new Exception("Erreur lors de la mise à jour du service de l'utilisateur: " . $e->getMessage());
    }
}

/**
 * Récupérer les permissions spécifiques d'un utilisateur
 */
public function getUserPermissions($userId) {
    try {
        error_log("Récupération des permissions personnalisées pour l'utilisateur $userId");
        
        $sql = $this->cnx->prepare('SELECT permission_key, value FROM user_permissions WHERE user_id = :user_id');
        $sql->bindParam(':user_id', $userId);
        $sql->execute();
        $results = $sql->fetchAll(PDO::FETCH_ASSOC);
        
        error_log("Nombre de permissions personnalisées trouvées: " . count($results));
        
        $permissions = [];
        foreach ($results as $row) {
            $permissions[$row['permission_key']] = (bool)(int)$row['value'];
            error_log("Permission personnalisée: {$row['permission_key']} = " . ($permissions[$row['permission_key']] ? 'true' : 'false'));
        }
        
        return $permissions;
    } catch (PDOException $e) {
        error_log("Erreur SQL dans getUserPermissions: " . $e->getMessage());
        throw new Exception("Erreur lors de la récupération des permissions de l'utilisateur: " . $e->getMessage());
    }
}


    /**
     * Mettre à jour les permissions d'un utilisateur
     */
    public function updateUserPermissions($userId, $permissions) {
        try {
            // Commencer une transaction
            $this->cnx->beginTransaction();
            
            // Supprimer les permissions existantes
            $sql = $this->cnx->prepare('DELETE FROM user_permissions WHERE user_id = :user_id');
            $sql->bindParam(':user_id', $userId);
            $sql->execute();
            
            // Insérer les nouvelles permissions
            $sql = $this->cnx->prepare('
                INSERT INTO user_permissions (user_id, permission_key, value)
                VALUES (:user_id, :key, :value)
            ');
            
            foreach ($permissions as $key => $value) {
                $sql->bindParam(':user_id', $userId);
                $sql->bindParam(':key', $key);
                $boolValue = $value ? 1 : 0;
                $sql->bindParam(':value', $boolValue, PDO::PARAM_INT);
                $sql->execute();
            }
            
            // Valider la transaction
            $this->cnx->commit();
            
            return true;
        } catch (PDOException $e) {
            // Annuler la transaction en cas d'erreur
            $this->cnx->rollBack();
            
            error_log("Erreur SQL dans updateUserPermissions: " . $e->getMessage());
            throw new Exception("Erreur lors de la mise à jour des permissions utilisateur: " . $e->getMessage());
        }
    }
    

/**
 * Vérifier si un utilisateur a des permissions personnalisées
 */
public function hasCustomPermissions($userId) {
    try {
        $sql = $this->cnx->prepare('SELECT COUNT(*) FROM user_permissions WHERE user_id = :user_id');
        $sql->bindParam(':user_id', $userId);
        $sql->execute();
        $count = $sql->fetchColumn() > 0;
        error_log("L'utilisateur $userId a des permissions personnalisées: " . ($count ? "Oui" : "Non"));
        return $count;
    } catch (PDOException $e) {
        error_log("Erreur SQL dans hasCustomPermissions: " . $e->getMessage());
        throw new Exception("Erreur lors de la vérification des permissions personnalisées: " . $e->getMessage());
    }
}
    /**
     * Réinitialiser les permissions d'un utilisateur (supprimer les personnalisations)
     */
    public function resetUserPermissions($userId) {
        try {
            $sql = $this->cnx->prepare('DELETE FROM user_permissions WHERE user_id = :user_id');
            $sql->bindParam(':user_id', $userId);
            $sql->execute();
            return true;
        } catch (PDOException $e) {
            error_log("Erreur SQL dans resetUserPermissions: " . $e->getMessage());
            throw new Exception("Erreur lors de la réinitialisation des permissions utilisateur: " . $e->getMessage());
        }
    }



}
?>