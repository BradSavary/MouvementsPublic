<?php
require_once "Repository/EntityRepository.php";

class LocationRepository extends EntityRepository {

    public function __construct() {
        parent::__construct();
    }

    public function find($id) {
        try {
            $sql = $this->cnx->prepare('SELECT * FROM location WHERE id = :id');
            $sql->bindParam(':id', $id);
            $sql->execute();
            $result = $sql->fetch(PDO::FETCH_ASSOC);
            
            if (!$result) {
                return null;
            }
            
            return $result['name'];
        } catch (PDOException $e) {
            error_log("Erreur SQL dans find: " . $e->getMessage());
            throw new Exception("Erreur lors de la recherche de l'emplacement: " . $e->getMessage());
        }
    }

public function findAll() {
    try {
        $sql = $this->cnx->prepare('SELECT id, name, type, service, section FROM location ORDER BY type, name');
        $sql->execute();
        $results = $sql->fetchAll(PDO::FETCH_ASSOC);
        return $results;
    } catch (PDOException $e) {
        error_log("Erreur SQL dans findAll: " . $e->getMessage());
        throw new Exception("Erreur lors de la récupération des emplacements: " . $e->getMessage());
    }
}

    public function findAllRooms() {
        try {
            $sql = $this->cnx->prepare('SELECT name FROM location WHERE type = "room" ORDER BY name');
            $sql->execute();
            $results = $sql->fetchAll(PDO::FETCH_COLUMN, 0);
            
            return $results;
        } catch (PDOException $e) {
            error_log("Erreur SQL dans findAllRooms: " . $e->getMessage());
            throw new Exception("Erreur lors de la récupération des chambres: " . $e->getMessage());
        }
    }

    public function findAllFacilities() {
        try {
            $sql = $this->cnx->prepare('SELECT name FROM location WHERE type = "facility" ORDER BY name');
            $sql->execute();
            $results = $sql->fetchAll(PDO::FETCH_COLUMN, 0);
            
            return $results;
        } catch (PDOException $e) {
            error_log("Erreur SQL dans findAllFacilities: " . $e->getMessage());
            throw new Exception("Erreur lors de la récupération des établissements: " . $e->getMessage());
        }
    }

    public function save($location) {
        try {
            $sql = $this->cnx->prepare('
                INSERT INTO location (name, type) 
                VALUES (:name, :type)
            ');
            
            $sql->bindValue(':name', $location['name']);
            $sql->bindValue(':type', $location['type']);
            
            $sql->execute();
            
            return true;
        } catch (PDOException $e) {
            error_log("Erreur SQL dans save: " . $e->getMessage());
            throw new Exception("Erreur lors de l'enregistrement de l'emplacement: " . $e->getMessage());
        }
    }

    public function delete($id) {
        try {
            $sql = $this->cnx->prepare('DELETE FROM location WHERE id = :id');
            $sql->bindParam(':id', $id, PDO::PARAM_INT);
            $sql->execute();
            
            return $sql->rowCount() > 0;
        } catch (PDOException $e) {
            error_log("Erreur SQL dans delete: " . $e->getMessage());
            throw new Exception("Erreur lors de la suppression de l'emplacement: " . $e->getMessage());
        }
    }


    public function update($location) {
        try {
            $sql = $this->cnx->prepare('
                UPDATE location SET
                    name = :name,
                    type = :type
                WHERE id = :id
            ');
            
            $sql->bindValue(':id', $location['id']);
            $sql->bindValue(':name', $location['name']);
            $sql->bindValue(':type', $location['type']);
            
            $sql->execute();
            
            return true;
        } catch (PDOException $e) {
            error_log("Erreur SQL dans update: " . $e->getMessage());
            throw new Exception("Erreur lors de la mise à jour de l'emplacement: " . $e->getMessage());
        }
    }

    /**
 * Ajouter un nouvel emplacement
 */
public function addLocation($name, $type, $service = null, $section = null) {
    try {
        // Vérifier si l'emplacement existe déjà
        $sql = $this->cnx->prepare('SELECT COUNT(*) FROM location WHERE name = :name');
        $sql->bindParam(':name', $name);
        $sql->execute();
        
        if ($sql->fetchColumn() > 0) {
            throw new Exception("Un emplacement avec ce nom existe déjà");
        }
        
        // Ajouter le nouvel emplacement avec le service et la section
        $sql = $this->cnx->prepare('INSERT INTO location (name, type, service, section) VALUES (:name, :type, :service, :section)');
        
        $sql->bindParam(':name', $name);
        $sql->bindParam(':type', $type);
        $sql->bindParam(':service', $service);
        $sql->bindParam(':section', $section);
        
        return $sql->execute();
    } catch (PDOException $e) {
        error_log("Erreur SQL dans addLocation: " . $e->getMessage());
        throw new Exception("Erreur lors de l'ajout de l'emplacement: " . $e->getMessage());
    }
}

/**
     * Supprimer un emplacement par son nom
     */
    public function deleteLocationByName($name) {
        try {
            $sql = $this->cnx->prepare('DELETE FROM location WHERE name = :name');
            $sql->bindParam(':name', $name);
            $sql->execute();
            
            return $sql->rowCount() > 0;
        } catch (PDOException $e) {
            error_log("Erreur SQL dans deleteLocationByName: " . $e->getMessage());
            throw new Exception("Erreur lors de la suppression de l'emplacement: " . $e->getMessage());
        }
    }

public function findAllPaginated($page = 1, $limit = 10, $type = '', $searchQuery = '') {
    try {
        // Calculer l'offset pour la pagination
        $offset = ($page - 1) * $limit;
        
        // Construction de la requête avec conditions de filtrage
         $query = "SELECT id, name, type, service, section FROM location WHERE 1=1";
        $params = [];
        
        // Filtre par type si fourni
        if (!empty($type)) {
            $query .= " AND type = :type";
            $params[':type'] = $type;
        }
        
        // Filtre par recherche si fournie
        if (!empty($searchQuery)) {
            $query .= " AND name LIKE :search";
            $params[':search'] = '%' . $searchQuery . '%';
        }
        
        // Tri et pagination
        $query .= " ORDER BY name ASC LIMIT :limit OFFSET :offset";
        
        // Préparer et exécuter la requête principale
        $sql = $this->cnx->prepare($query);
        
        // Lier les paramètres de filtrage
        foreach ($params as $key => $value) {
            $sql->bindValue($key, $value);
        }
        
        $sql->bindParam(':limit', $limit, PDO::PARAM_INT);
        $sql->bindParam(':offset', $offset, PDO::PARAM_INT);
        $sql->execute();
        $results = $sql->fetchAll(PDO::FETCH_ASSOC);
        
        // Requête pour compter le nombre total d'éléments (avec les mêmes filtres)
        $countQuery = "SELECT COUNT(*) as total FROM location WHERE 1=1";
        
        if (!empty($type)) {
            $countQuery .= " AND type = :type";
        }
        
        if (!empty($searchQuery)) {
            $countQuery .= " AND name LIKE :search";
        }
        
        $countSql = $this->cnx->prepare($countQuery);
        
        // Lier les paramètres de filtrage pour la requête de comptage
        foreach ($params as $key => $value) {
            $countSql->bindValue($key, $value);
        }
        
        $countSql->execute();
        $totalCount = $countSql->fetch(PDO::FETCH_ASSOC)['total'];
        $totalPages = ceil($totalCount / $limit);
        
        return [
            'items' => $results,
            'totalItems' => $totalCount,
            'totalPages' => $totalPages,
            'currentPage' => $page
        ];
    } catch (PDOException $e) {
        error_log("Erreur SQL dans findAllPaginated: " . $e->getMessage());
        throw new Exception("Erreur lors de la récupération des emplacements: " . $e->getMessage());
    }
}

}
?>