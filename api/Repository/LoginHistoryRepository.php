<?php
require_once "Repository/EntityRepository.php";

class LoginHistoryRepository extends EntityRepository {

    public function __construct() {
        parent::__construct();
    }
    
    /**
     * Ajouter une entrée dans l'historique des connexions
     */
    public function addLoginRecord($username, $success, $ipAddress = null, $userAgent = null, $details = null) {
        try {
            $sql = $this->cnx->prepare('
                INSERT INTO login_history 
                (username, login_date, ip_address, user_agent, success, details) 
                VALUES 
                (:username, NOW(), :ip_address, :user_agent, :success, :details)
            ');
            
            $sql->bindParam(':username', $username);
            $sql->bindParam(':ip_address', $ipAddress);
            $sql->bindParam(':user_agent', $userAgent);
            $sql->bindParam(':success', $success, PDO::PARAM_BOOL);
            $sql->bindParam(':details', $details);
            
            return $sql->execute();
        } catch (PDOException $e) {
            error_log("Erreur SQL dans addLoginRecord: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Récupérer l'historique des connexions avec pagination et filtres
     */
   public function getLoginHistory($page = 1, $limit = 20, $username = '', $dateFrom = '', $dateTo = '', $status = '') {
    try {
        // Calculer l'offset pour la pagination
        $offset = ($page - 1) * $limit;
        
        // Construction de la requête avec conditions de filtrage
        $query = "SELECT id, username, login_date, ip_address, user_agent, success, details FROM login_history WHERE 1=1";
        $params = [];
        
        // Ajouter les filtres
        if (!empty($username)) {
            $query .= " AND username LIKE :username";
            $params[':username'] = "%$username%";
        }
        
        if (!empty($dateFrom)) {
            $query .= " AND DATE(login_date) >= :dateFrom";
            $params[':dateFrom'] = $dateFrom;
        }
        
        if (!empty($dateTo)) {
            $query .= " AND DATE(login_date) <= :dateTo";
            $params[':dateTo'] = $dateTo;
        }
        
        // Modifier cette partie pour traiter correctement "all" ou "" comme "tous"
        if ($status !== '' && $status !== 'all') {
            $success = ($status === 'success') ? 1 : 0;
            $query .= " AND success = :success";
            $params[':success'] = $success;
        }
            
            // Compter le nombre total d'éléments pour la pagination
            $countQuery = str_replace("SELECT id, username, login_date, ip_address, user_agent, success, details", "SELECT COUNT(*)", $query);
            $countSql = $this->cnx->prepare($countQuery);
            
            foreach ($params as $key => $value) {
                $countSql->bindValue($key, $value);
            }
            
            $countSql->execute();
            $totalItems = $countSql->fetchColumn();
            $totalPages = ceil($totalItems / $limit);
            
            // Ajouter le tri et la pagination
            $query .= " ORDER BY login_date DESC LIMIT :limit OFFSET :offset";
            
            $sql = $this->cnx->prepare($query);
            
            // Lier les paramètres de filtrage
            foreach ($params as $key => $value) {
                $sql->bindValue($key, $value);
            }
            
            $sql->bindValue(':limit', $limit, PDO::PARAM_INT);
            $sql->bindValue(':offset', $offset, PDO::PARAM_INT);
            $sql->execute();
            
            $results = $sql->fetchAll(PDO::FETCH_ASSOC);
            
            return [
                'items' => $results,
                'totalItems' => $totalItems,
                'totalPages' => $totalPages,
                'currentPage' => $page
            ];
        } catch (PDOException $e) {
            error_log("Erreur SQL dans getLoginHistory: " . $e->getMessage());
            throw new Exception("Erreur lors de la récupération de l'historique des connexions: " . $e->getMessage());
        }
    }

    // Implémentation des méthodes abstraites requises
    public function find($id) {
        try {
            $sql = $this->cnx->prepare('SELECT * FROM login_history WHERE id = :id');
            $sql->bindParam(':id', $id);
            $sql->execute();
            return $sql->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Erreur SQL dans find: " . $e->getMessage());
            return null;
        }
    }

    public function findAll() {
        try {
            $sql = $this->cnx->prepare('SELECT * FROM login_history ORDER BY login_date DESC');
            $sql->execute();
            return $sql->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Erreur SQL dans findAll: " . $e->getMessage());
            return [];
        }
    }

    public function save($entity) {
        // Non utilisé directement
        return false;
    }

    public function delete($id) {
        try {
            $sql = $this->cnx->prepare('DELETE FROM login_history WHERE id = :id');
            $sql->bindParam(':id', $id);
            return $sql->execute();
        } catch (PDOException $e) {
            error_log("Erreur SQL dans delete: " . $e->getMessage());
            return false;
        }
    }

    public function update($entity) {
        // Non utilisé directement
        return false;
    }

public function getLoginCount($fromDate) {
    try {
        // Nombre total de connexions
        $sqlTotal = $this->cnx->prepare('
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful,
                SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failed
            FROM 
                login_history 
            WHERE 
                login_date >= :fromDate
        ');
        
        $sqlTotal->bindParam(':fromDate', $fromDate);
        $sqlTotal->execute();
        $totals = $sqlTotal->fetch(PDO::FETCH_ASSOC);
        
        // Connexions par jour
        $sqlByDay = $this->cnx->prepare('
            SELECT 
                DATE(login_date) as date,
                COUNT(*) as count,
                SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful,
                SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failed
            FROM 
                login_history 
            WHERE 
                login_date >= :fromDate
            GROUP BY 
                DATE(login_date)
            ORDER BY
                date
        ');
        
        $sqlByDay->bindParam(':fromDate', $fromDate);
        $sqlByDay->execute();
        $byDay = $sqlByDay->fetchAll(PDO::FETCH_ASSOC);
        
        return [
            "totals" => $totals,
            "byDay" => $byDay
        ];
    } catch (PDOException $e) {
        error_log("Erreur SQL dans getLoginCount: " . $e->getMessage());
        throw new Exception("Erreur lors du comptage des connexions: " . $e->getMessage());
    }
}

public function getUserLoginCount($fromDate) {
    try {
        $sql = $this->cnx->prepare('
            SELECT 
                username,
                COUNT(*) as total,
                SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful,
                SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failed
            FROM 
                login_history 
            WHERE 
                login_date >= :fromDate
            GROUP BY 
                username
            ORDER BY
                total DESC
            LIMIT 10
        ');
        
        $sql->bindParam(':fromDate', $fromDate);
        $sql->execute();
        
        return $sql->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        error_log("Erreur SQL dans getUserLoginCount: " . $e->getMessage());
        throw new Exception("Erreur lors du comptage des connexions par utilisateur: " . $e->getMessage());
    }
}






}
