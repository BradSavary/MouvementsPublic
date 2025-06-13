<?php
require_once "Repository/EntityRepository.php";
require_once "Class/Deces.php";

class DecesRepository extends EntityRepository {

    public function __construct() {
        parent::__construct();
    }

    public function find($id) {
        try {
            $sql = $this->cnx->prepare('SELECT * FROM deces WHERE id = :id');
            $sql->bindParam(':id', $id);
            $sql->execute();
            $result = $sql->fetch(PDO::FETCH_ASSOC);
            
            if (!$result) {
                return null;
            }
            
            return $this->createFromArray($result);
        } catch (PDOException $e) {
            error_log("Erreur SQL dans find: " . $e->getMessage());
            throw new Exception("Erreur lors de la recherche du décès: " . $e->getMessage());
        }
    }

        public function findAll($sortOrder = 'desc', $page = 1, $limit = 10, $dateFrom = '', $dateTo = '', $serviceFilter = null, $checkStatus = '') {
            try {
                // Calculer l'offset pour la pagination
                $offset = ($page - 1) * $limit;
                
                // Validation de l'ordre de tri
                $sortDirection = strtoupper($sortOrder) === 'ASC' ? 'ASC' : 'DESC';
                
                // Construction de la requête avec conditions de filtrage
                $query = "SELECT d.* FROM deces d";
                
                // Si un filtre de service est spécifié, faire un JOIN avec la table user
                if ($serviceFilter) {
                    $query .= " LEFT JOIN user u ON d.author = u.username";
                }
                
                $query .= " WHERE 1=1";
                $params = [];
                
                // Filtre par date de début si fournie
                if (!empty($dateFrom)) {
                    $query .= " AND d.date_deces >= :dateFrom";
                    $params[':dateFrom'] = $dateFrom;
                }
                
                // Filtre par date de fin si fournie
                if (!empty($dateTo)) {
                    $query .= " AND d.date_deces <= :dateTo";
                    $params[':dateTo'] = $dateTo;
                }
                
                // Filtre par service si fourni
                if ($serviceFilter) {
                    $query .= " AND u.service = :service";
                    $params[':service'] = $serviceFilter;
                }
                
                // Filtre par statut de validation
                if (!empty($checkStatus)) {
                    if ($checkStatus === 'checked') {
                        $query .= " AND d.checked = 1";
                    } else if ($checkStatus === 'unchecked') {
                        $query .= " AND (d.checked = 0 OR d.checked IS NULL)";
                    }
                }
                
                // Tri et pagination
                $query .= " ORDER BY d.date_deces " . $sortDirection . ", d.heure_deces " . $sortDirection;
                $query .= " LIMIT :limit OFFSET :offset";
                
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
                
                // Requête pour compter le nombre total d'éléments (avec les mêmes filtres mais sans pagination)
                $countQuery = "SELECT COUNT(*) as total FROM deces d";
                
                if ($serviceFilter) {
                    $countQuery .= " LEFT JOIN user u ON d.author = u.username";
                }
                
                $countQuery .= " WHERE 1=1";
                
                if (!empty($dateFrom)) {
                    $countQuery .= " AND d.date_deces >= :dateFrom";
                }
                
                if (!empty($dateTo)) {
                    $countQuery .= " AND d.date_deces <= :dateTo";
                }
                
                if ($serviceFilter) {
                    $countQuery .= " AND u.service = :service";
                }
                
                // Ajouter le filtre de validation à la requête de comptage
                if (!empty($checkStatus)) {
                    if ($checkStatus === 'checked') {
                        $countQuery .= " AND d.checked = 1";
                    } else if ($checkStatus === 'unchecked') {
                        $countQuery .= " AND (d.checked = 0 OR d.checked IS NULL)";
                    }
                }
                
                $countSql = $this->cnx->prepare($countQuery);
                
                foreach ($params as $key => $value) {
                    $countSql->bindValue($key, $value);
                }
                
                $countSql->execute();
                $totalCount = $countSql->fetch(PDO::FETCH_ASSOC)['total'];
                $totalPages = ceil($totalCount / $limit);
                
                // Créer des objets Deces à partir des données récupérées
                $deces = array_map(function($row) {
                    return $this->createFromArray($row);
                }, $results);
                
                return [
                    'items' => $deces,
                    'totalPages' => $totalPages,
                    'currentPage' => $page,
                    'totalItems' => $totalCount
                ];
            } catch (PDOException $e) {
                error_log("Erreur SQL dans findAll: " . $e->getMessage());
                throw new Exception("Erreur lors de la récupération des décès: " . $e->getMessage());
            }
        }

      public function search($query, $sortOrder = 'desc', $page = 1, $limit = 10, $dateFrom = '', $dateTo = '', $serviceFilter = null, $checkStatus = '') {
    try {
        // Calculer l'offset pour la pagination
        $offset = ($page - 1) * $limit;
        
        // Construction de la requête avec conditions de filtrage
        $sqlQuery = "SELECT d.* FROM deces d WHERE (d.nom LIKE :query OR d.prenom LIKE :query OR d.nom_naissance LIKE :query)";
        $params = [
            ':query' => '%' . $query . '%'
        ];
        
        // Ajouter le filtre de date de début si fourni
        if (!empty($dateFrom)) {
            $sqlQuery .= " AND d.date_deces >= :dateFrom";
            $params[':dateFrom'] = $dateFrom;
        }
        
        // Ajouter le filtre de date de fin si fourni
        if (!empty($dateTo)) {
            $sqlQuery .= " AND d.date_deces <= :dateTo";
            $params[':dateTo'] = $dateTo;
        }
        
        // Ajouter le filtre de service si fourni
        if (!empty($serviceFilter)) {
            $sqlQuery .= " AND (d.chambre IN (SELECT name FROM location WHERE service = :serviceFilter))";
            $params[':serviceFilter'] = $serviceFilter;
        }
        
        // Ajouter le filtre de statut de vérification
        if (!empty($checkStatus)) {
            if ($checkStatus === 'checked') {
                $sqlQuery .= " AND d.checked = 1";
            } else if ($checkStatus === 'unchecked') {
                $sqlQuery .= " AND (d.checked = 0 OR d.checked IS NULL)";
            }
        }
        
        // Tri et pagination
        $sqlQuery .= " ORDER BY d.date_deces " . ($sortOrder === 'asc' ? 'ASC' : 'DESC');
        $sqlQuery .= " LIMIT :limit OFFSET :offset";
        
        // Préparer et exécuter la requête
        $sql = $this->cnx->prepare($sqlQuery);
        
        // Lier les paramètres
        foreach ($params as $key => $value) {
            $sql->bindValue($key, $value);
        }
        
        $sql->bindValue(':limit', $limit, PDO::PARAM_INT);
        $sql->bindValue(':offset', $offset, PDO::PARAM_INT);
        $sql->execute();
        
        $results = $sql->fetchAll(PDO::FETCH_ASSOC);
        
        // Requête pour compter le nombre total d'items
        $countQuery = str_replace("SELECT d.*", "SELECT COUNT(*) as total", $sqlQuery);
        $countQuery = preg_replace('/\s+LIMIT\s+:\w+\s+OFFSET\s+:\w+$/i', '', $countQuery);
        
        $countSql = $this->cnx->prepare($countQuery);
        foreach ($params as $key => $value) {
            $countSql->bindValue($key, $value);
        }
        
        $countSql->execute();
        $count = $countSql->fetch(PDO::FETCH_ASSOC)['total'];
        
        $items = [];
        foreach ($results as $result) {
            $items[] = $this->createFromArray($result);
        }
        
        return [
            'items' => $items,
            'totalPages' => ceil($count / $limit),
            'currentPage' => $page,
            'totalItems' => $count
        ];
    } catch (PDOException $e) {
        error_log("Erreur SQL dans DecesRepository::search: " . $e->getMessage());
        throw new Exception("Erreur lors de la recherche des décès: " . $e->getMessage());
    }
}

    public function save($deces) {
        try {
            $sql = $this->cnx->prepare('
                INSERT INTO deces (nom, nom_naissance, prenom, naissance, sex, date_deces, heure_deces, chambre, section, author)
                VALUES (:nom, :nom_naissance, :prenom, :naissance, :sex, :date_deces, :heure_deces, :chambre, :section, :author)
            ');
            
            $sql->bindValue(':nom', $deces->getNom());
            $sql->bindValue(':nom_naissance', $deces->getNomNaissance());
            $sql->bindValue(':prenom', $deces->getPrenom());
            $sql->bindValue(':naissance', $deces->getNaissance());
            $sql->bindValue(':sex', $deces->getSex());
            $sql->bindValue(':date_deces', $deces->getDateDeces());
            $sql->bindValue(':heure_deces', $deces->getHeureDeces());
            $sql->bindValue(':chambre', $deces->getChambre());
            $sql->bindValue(':section', $deces->getSection());
            $sql->bindValue(':author', $deces->getAuthor());
            
            $sql->execute();
            
            // Récupérer l'ID inséré
            $id = $this->cnx->lastInsertId();
            
            // Retourner l'objet mis à jour
            return $this->find($id);
        } catch (PDOException $e) {
            error_log("Erreur SQL dans save: " . $e->getMessage());
            throw new Exception("Erreur lors de l'enregistrement du décès: " . $e->getMessage());
        }
    }

    public function delete($id) {
        try {
            $sql = $this->cnx->prepare('DELETE FROM deces WHERE id = :id');
            $sql->bindParam(':id', $id);
            $sql->execute();
            
            return $sql->rowCount() > 0;
        } catch (PDOException $e) {
            error_log("Erreur SQL dans delete: " . $e->getMessage());
            throw new Exception("Erreur lors de la suppression du décès: " . $e->getMessage());
        }
    }

    public function update($deces) {
        // Implémentation pour mettre à jour un décès
        try {
            $sql = $this->cnx->prepare('
                UPDATE deces SET
                    nom = :nom,
                    prenom = :prenom,
                    naissance = :naissance,
                    sex = :sex,
                    date_deces = :date_deces,
                    heure_deces = :heure_deces,
                    chambre = :chambre,
                    author = :author
                WHERE id = :id
            ');
            
            $sql->bindValue(':id', $deces->getId());
            $sql->bindValue(':nom', $deces->getNom());
            $sql->bindValue(':prenom', $deces->getPrenom());
            $sql->bindValue(':naissance', $deces->getNaissance());
            $sql->bindValue(':sex', $deces->getSex());
            $sql->bindValue(':date_deces', $deces->getDateDeces());
            $sql->bindValue(':heure_deces', $deces->getHeureDeces());
            $sql->bindValue(':chambre', $deces->getChambre());
            $sql->bindValue(':author', $deces->getAuthor());
            
            $sql->execute();
            
            return true;
        } catch (PDOException $e) {
            error_log("Erreur SQL dans update: " . $e->getMessage());
            throw new Exception("Erreur lors de la mise à jour du décès: " . $e->getMessage());
        }
    }



    /**
     * Créer un objet Deces à partir d'un tableau associatif
     */
    private function createFromArray($data) {
        $deces = new Deces($data['id']);
        $deces->setNom($data['nom']);
        $deces->setNomNaissance($data['nom_naissance']);
        $deces->setPrenom($data['prenom']);
        $deces->setNaissance($data['naissance']);
        $deces->setSex($data['sex']);
        $deces->setDateDeces($data['date_deces']);
        $deces->setHeureDeces($data['heure_deces']);
        $deces->setChambre($data['chambre']);
        $deces->setSection($data['section'] ?? null);
        $deces->setAuthor($data['author']);
        $deces->setChecked(isset($data['checked']) ? (bool)$data['checked'] : false);
        $deces->setCheckedBy($data['checked_by'] ?? null);
        
        return $deces;
    }

    /**
     * Créer un objet Deces à partir de données JSON
     */
    public function createFromData($data) {
        $deces = new Deces(0);
        $deces->setNom($data['nom']);
        $deces->setNomNaissance($data['nom_naissance']);
        $deces->setPrenom($data['prenom']);
        $deces->setNaissance($data['naissance']);
        $deces->setSex($data['sex']);
        $deces->setDateDeces($data['date_deces']);
        $deces->setHeureDeces($data['heure_deces']);
        $deces->setChambre($data['chambre']);
        $deces->setSection($data['section'] ?? null);
        $deces->setAuthor($data['author']);
        $deces->setChecked(isset($data['checked']) ? (bool)$data['checked'] : false);
        $deces->setCheckedBy($data['checkedBy'] ?? null);
        
        return $deces;
    }

    public function toggleChecked($id, $checked, $username) {
        try {
            $sql = $this->cnx->prepare('UPDATE deces SET checked = :checked, checked_by = :checked_by WHERE id = :id');
            $sql->bindParam(':id', $id);
            $sql->bindParam(':checked', $checked, PDO::PARAM_BOOL);
            $sql->bindParam(':checked_by', $username);
            $sql->execute();
            
            return $sql->rowCount() > 0;
        } catch (PDOException $e) {
            error_log("Erreur SQL dans toggleChecked: " . $e->getMessage());
            throw new Exception("Erreur lors de la modification du statut: " . $e->getMessage());
        }
    }

    public function countUnvalidated() {
    try {
        $sql = $this->cnx->prepare('SELECT COUNT(*) as total FROM deces WHERE checked = 0');
        $sql->execute();
        return (int)$sql->fetch(PDO::FETCH_ASSOC)['total'];
    } catch (PDOException $e) {
        error_log("Erreur SQL dans countUnvalidated: " . $e->getMessage());
        return 0;
    }
}

public function getDeathsCount($fromDate) {
    try {
        // Nombre total de décès depuis la date donnée
        $sql = $this->cnx->prepare('
            SELECT 
                COUNT(*) as total,
                DATE_FORMAT(date_deces, "%Y-%m") as month,
                COUNT(*) as count 
            FROM 
                deces 
            WHERE 
                date_deces >= :fromDate 
            GROUP BY
                DATE_FORMAT(date_deces, "%Y-%m")
            ORDER BY
                month
        ');
        
        $sql->bindParam(':fromDate', $fromDate);
        $sql->execute();
        
        $byMonth = $sql->fetchAll(PDO::FETCH_ASSOC);
        
        // Compter le total général
        $sqlTotal = $this->cnx->prepare('
            SELECT 
                COUNT(*) as total
            FROM 
                deces 
            WHERE 
                date_deces >= :fromDate 
        ');
        
        $sqlTotal->bindParam(':fromDate', $fromDate);
        $sqlTotal->execute();
        $total = $sqlTotal->fetch(PDO::FETCH_ASSOC)['total'];
        
        return [
            "total" => $total,
            "byMonth" => $byMonth
        ];
    } catch (PDOException $e) {
        error_log("Erreur SQL dans getDeathsCount: " . $e->getMessage());
        throw new Exception("Erreur lors du comptage des décès: " . $e->getMessage());
    }
}





}
