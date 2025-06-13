<?php
require_once "Repository/EntityRepository.php";
require_once "Class/Mouvement.php";

class MouvementRepository extends EntityRepository {

    public function __construct() {
        parent::__construct();
    }

    public function find($id) {
        try {
            $sql = $this->cnx->prepare('SELECT * FROM mouvement WHERE id = :id');
            $sql->bindParam(':id', $id);
            $sql->execute();
            $result = $sql->fetch(PDO::FETCH_ASSOC);
            
            if (!$result) {
                return null;
            }
            
            return $this->createFromArray($result);
        } catch (PDOException $e) {
            error_log("Erreur SQL dans find: " . $e->getMessage());
            throw new Exception("Erreur lors de la recherche du mouvement: " . $e->getMessage());
        }
    }

    public function findAll($sortOrder = 'desc', $page = 1, $limit = 10, $type = '', $dateFrom = '', $dateTo = '', $serviceFilter = null, $checkStatus = '') {
        try {
            // Calculer l'offset pour la pagination
            $offset = ($page - 1) * $limit;
            
            // Validation de l'ordre de tri
            $sortDirection = strtoupper($sortOrder) === 'ASC' ? 'ASC' : 'DESC';
            
            // Construction de la requête avec conditions de filtrage
            $query = "SELECT DISTINCT m.* FROM mouvement m";
            
            // Joindre les tables de location pour les filtres de service des chambres
            if ($serviceFilter) {
                $query .= " LEFT JOIN location lchambre_depart ON m.chambreDepart = lchambre_depart.name";
                $query .= " LEFT JOIN location lchambre_arrivee ON m.chambreArrivee = lchambre_arrivee.name";
            }
            
            $query .= " WHERE 1=1";
            $params = [];
            
            // Filtre par type de mouvement si fourni
            if (!empty($type)) {
                $query .= " AND m.type = :type";
                $params[':type'] = $type;
            }
            
            // Filtre par date de début si fournie
            if (!empty($dateFrom)) {
                $query .= " AND m.date >= :dateFrom";
                $params[':dateFrom'] = $dateFrom;
            }
            
            // Filtre par date de fin si fournie
            if (!empty($dateTo)) {
                $query .= " AND m.date <= :dateTo";
                $params[':dateTo'] = $dateTo;
            }
            
            // Filtre par service si fourni
            if ($serviceFilter) {
                $query .= " AND (lchambre_depart.service = :service OR lchambre_arrivee.service = :service)";
                $params[':service'] = $serviceFilter;
            }
            
            // Filtre par statut de vérification
            if (!empty($checkStatus)) {
                if ($checkStatus === 'checked') {
                    $query .= " AND m.checked = 1";
                } else if ($checkStatus === 'unchecked') {
                    $query .= " AND (m.checked = 0 OR m.checked IS NULL)";
                }
            }
            
            // Journalisation pour débogage
            error_log("SQL findAll: " . $query);
            error_log("Params findAll: " . json_encode($params));
            
            // Tri et pagination
            $query .= " ORDER BY m.date " . $sortDirection . ", m.time " . $sortDirection;
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
            
            // Journaliser le nombre de résultats trouvés
            error_log("Nombre de résultats trouvés (findAll): " . count($results));
            
            // Requête pour compter le nombre total d'éléments (avec les mêmes filtres)
            $countQuery = "SELECT COUNT(DISTINCT m.id) as total FROM mouvement m";
            
            if ($serviceFilter) {
                $countQuery .= " LEFT JOIN location lchambre_depart ON m.chambreDepart = lchambre_depart.name";
                $countQuery .= " LEFT JOIN location lchambre_arrivee ON m.chambreArrivee = lchambre_arrivee.name";
            }
            
            $countQuery .= " WHERE 1=1";
            
            if (!empty($type)) {
                $countQuery .= " AND m.type = :type";
            }
            
            if (!empty($dateFrom)) {
                $countQuery .= " AND m.date >= :dateFrom";
            }
            
            if (!empty($dateTo)) {
                $countQuery .= " AND m.date <= :dateTo";
            }
            
            if ($serviceFilter) {
                $countQuery .= " AND (lchambre_depart.service = :service OR lchambre_arrivee.service = :service)";
            }
            
            $countSql = $this->cnx->prepare($countQuery);
            
            // Lier les paramètres de filtrage pour la requête de comptage
            foreach ($params as $key => $value) {
                $countSql->bindValue($key, $value);
            }
            
            $countSql->execute();
            $totalCount = $countSql->fetch(PDO::FETCH_ASSOC)['total'];
            $totalPages = ceil($totalCount / $limit);
            
            // Convertir les résultats en objets Mouvement
            $mouvements = [];
            foreach ($results as $row) {
                $mouvements[] = $this->createFromArray($row);
            }
            
            return [
                'items' => $mouvements,
                'totalPages' => $totalPages,
                'currentPage' => $page
            ];
            
        } catch (PDOException $e) {
            error_log("Erreur SQL dans findAll: " . $e->getMessage());
            throw new Exception("Erreur lors de la récupération des mouvements: " . $e->getMessage());
        }
    }
    
    public function search($query, $sortOrder = 'desc', $page = 1, $limit = 10, $type = '', $dateFrom = '', $dateTo = '', $serviceFilter = null, $checkStatus = '') {
    try {
        // Calculer l'offset pour la pagination
        $offset = ($page - 1) * $limit;
        
        // Construction de la requête avec conditions de filtrage
        $sqlQuery = "SELECT m.* FROM mouvement m WHERE (m.nom LIKE :query OR m.prenom LIKE :query OR m.nom_naissance LIKE :query)";
        $params = [
            ':query' => '%' . $query . '%'
        ];
        
        // Ajouter les autres filtres à la requête
        if (!empty($type)) {
            $sqlQuery .= " AND m.type = :type";
            $params[':type'] = $type;
        }
        
        if (!empty($dateFrom)) {
            $sqlQuery .= " AND m.date >= :dateFrom";
            $params[':dateFrom'] = $dateFrom;
        }
        
        if (!empty($dateTo)) {
            $sqlQuery .= " AND m.date <= :dateTo";
            $params[':dateTo'] = $dateTo;
        }
        
        if (!empty($serviceFilter)) {
            // Adapter selon votre structure de données pour filtrer par service
            $sqlQuery .= " AND (m.chambreArrivee IN (SELECT name FROM location WHERE service = :serviceFilter) OR m.chambreDepart IN (SELECT name FROM location WHERE service = :serviceFilter))";
            $params[':serviceFilter'] = $serviceFilter;
        }
        
        if (!empty($checkStatus)) {
            if ($checkStatus === 'checked') {
                $sqlQuery .= " AND m.checked = 1";
            } else if ($checkStatus === 'unchecked') {
                $sqlQuery .= " AND (m.checked = 0 OR m.checked IS NULL)";
            }
        }
        
        // Tri et pagination
        $sqlQuery .= " ORDER BY m.date " . ($sortOrder === 'asc' ? 'ASC' : 'DESC');
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
        $countQuery = str_replace("SELECT m.*", "SELECT COUNT(*) as total", $sqlQuery);
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
        
        $totalPages = ceil($count / $limit);
        
        return [
            'items' => $items,
            'totalPages' => $totalPages,
            'currentPage' => $page,
            'totalItems' => $count
        ];
        
    } catch (PDOException $e) {
        error_log("Erreur SQL dans MouvementRepository::search: " . $e->getMessage());
        throw new Exception("Erreur lors de la recherche des mouvements: " . $e->getMessage());
    }
}

    public function save($mouvement) {
        try {
            $sql = $this->cnx->prepare('
                INSERT INTO mouvement (nom, nom_naissance, prenom, naissance, sex, type, date, time, lieuDepart, lieuArrivee, chambreDepart, chambreArrivee, sectionDepart, sectionArrivee, sejour, author)
                VALUES (:nom, :nom_naissance, :prenom, :naissance, :sex, :type, :date, :time, :lieuDepart, :lieuArrivee, :chambreDepart, :chambreArrivee, :sectionDepart, :sectionArrivee, :sejour, :author)
            ');
            
            $sql->bindValue(':nom', $mouvement->getNom());
            $sql->bindValue(':nom_naissance', $mouvement->getNomNaissance());
            $sql->bindValue(':prenom', $mouvement->getPrenom());
            $sql->bindValue(':naissance', $mouvement->getNaissance());
            $sql->bindValue(':sex', $mouvement->getSex());
            $sql->bindValue(':type', $mouvement->getType());
            $sql->bindValue(':date', $mouvement->getDate());
            $sql->bindValue(':time', $mouvement->getTime());
            $sql->bindValue(':lieuDepart', $mouvement->getLieuDepart());
            $sql->bindValue(':lieuArrivee', $mouvement->getLieuArrivee());
            $sql->bindValue(':chambreDepart', $mouvement->getChambreDepart());
            $sql->bindValue(':chambreArrivee', $mouvement->getChambreArrivee());
            $sql->bindValue(':sejour', $mouvement->getSejour());
            $sql->bindValue(':author', $mouvement->getAuthor());
            $sql->bindValue(':sectionDepart', $mouvement->getSectionDepart());
            $sql->bindValue(':sectionArrivee', $mouvement->getSectionArrivee());
            
            $sql->execute();
            
            // Récupérer l'ID inséré
            $id = $this->cnx->lastInsertId();
            
            // Mettre à jour l'ID du mouvement
            $mouvement = $this->find($id);
            
            return true;
        } catch (PDOException $e) {
            error_log("Erreur SQL dans save: " . $e->getMessage());
            throw new Exception("Erreur lors de l'enregistrement du mouvement: " . $e->getMessage());
        }
    }

    public function delete($id) {
        try {
            $sql = $this->cnx->prepare('DELETE FROM mouvement WHERE id = :id');
            $sql->bindParam(':id', $id, PDO::PARAM_INT);
            $sql->execute();
            
            // Vérifier si une ligne a été affectée
            return $sql->rowCount() > 0;
        } catch (PDOException $e) {
            error_log("Erreur SQL dans delete: " . $e->getMessage());
            throw new Exception("Erreur lors de la suppression du mouvement: " . $e->getMessage());
        }
    }

    public function update($mouvement) {
        try {
            $sql = $this->cnx->prepare('
                UPDATE mouvement SET
                    nom = :nom,
                    prenom = :prenom,
                    naissance = :naissance,
                    sex = :sex,
                    type = :type,
                    date = :date,
                    time = :time,
                    lieuDepart = :lieuDepart,
                    lieuArrivee = :lieuArrivee,
                    chambreDepart = :chambreDepart,
                    chambreArrivee = :chambreArrivee,
                    sejour = :sejour,
                    author = :author
                WHERE id = :id
            ');
            
            $sql->bindValue(':id', $mouvement->getId());
            $sql->bindValue(':nom', $mouvement->getNom());
            $sql->bindValue(':prenom', $mouvement->getPrenom());
            $sql->bindValue(':naissance', $mouvement->getNaissance());
            $sql->bindValue(':sex', $mouvement->getSex());
            $sql->bindValue(':type', $mouvement->getType());
            $sql->bindValue(':date', $mouvement->getDate());
            $sql->bindValue(':time', $mouvement->getTime());
            $sql->bindValue(':lieuDepart', $mouvement->getLieuDepart());
            $sql->bindValue(':lieuArrivee', $mouvement->getLieuArrivee());
            $sql->bindValue(':chambreDepart', $mouvement->getChambreDepart());
            $sql->bindValue(':chambreArrivee', $mouvement->getChambreArrivee());
            $sql->bindValue(':sejour', $mouvement->getSejour());
            $sql->bindValue(':author', $mouvement->getAuthor());
            
            $sql->execute();
            
            return true;
        } catch (PDOException $e) {
            error_log("Erreur SQL dans update: " . $e->getMessage());
            throw new Exception("Erreur lors de la mise à jour du mouvement: " . $e->getMessage());
        }
    }


    /**
     * Créer un objet Mouvement à partir d'un tableau associatif
     */
    private function createFromArray($data) {
        $mouvement = new Mouvement($data['id']);
        $mouvement->setNom($data['nom']);
        $mouvement->setNomNaissance($data['nom_naissance']);
        $mouvement->setPrenom($data['prenom']);
        $mouvement->setNaissance($data['naissance']);
        $mouvement->setSex($data['sex']);
        $mouvement->setType($data['type']);
        $mouvement->setDate($data['date']);
        $mouvement->setTime($data['time'] ?? null);
        $mouvement->setLieuDepart($data['lieuDepart'] ?? null);
        $mouvement->setLieuArrivee($data['lieuArrivee'] ?? null);
        $mouvement->setChambreDepart($data['chambreDepart'] ?? null);
        $mouvement->setChambreArrivee($data['chambreArrivee'] ?? null);
        $mouvement->setSectionDepart($data['sectionDepart'] ?? null);
        $mouvement->setSectionArrivee($data['sectionArrivee'] ?? null);
        $mouvement->setSejour($data['sejour'] ?? null);
        $mouvement->setAuthor($data['author']);
        $mouvement->setChecked(isset($data['checked']) ? (bool)$data['checked'] : false);
        $mouvement->setCheckedBy($data['checked_by'] ?? null);
        
        return $mouvement;
    }

    /**
     * Créer un objet Mouvement à partir de données JSON
     */
    public function createFromData($data) {
        $mouvement = new Mouvement(0);
        $mouvement->setNom($data['nom']);
        $mouvement->setNomNaissance($data['nom_naissance']);
        $mouvement->setPrenom($data['prenom']);
        $mouvement->setNaissance($data['naissance']);
        $mouvement->setSex($data['sex']);
        $mouvement->setType($data['type']);
        $mouvement->setDate($data['date']);
        $mouvement->setTime($data['time'] ?? null);
        $mouvement->setLieuDepart($data['lieuDepart'] ?? null);
        $mouvement->setLieuArrivee($data['lieuArrivee'] ?? null);
        $mouvement->setChambreDepart($data['chambreDepart'] ?? null);
        $mouvement->setChambreArrivee($data['chambreArrivee'] ?? null);
        $mouvement->setSectionDepart($data['sectionDepart'] ?? null);
        $mouvement->setSectionArrivee($data['sectionArrivee'] ?? null);
        $mouvement->setSejour($data['sejour'] ?? null);
        $mouvement->setAuthor($data['author']);
        $mouvement->setChecked(isset($data['checked']) ? (bool)$data['checked'] : false);
        
        return $mouvement;
    }

    public function deleteOlderThan($months, $userId = null, $username = null) {
        try {
            // Calculer la date limite
            $cutoffDate = date('Y-m-d', strtotime("-$months months"));
            
            // Journal avant suppression
            error_log("Suppression des mouvements antérieurs à $cutoffDate");
            
            // Compter d'abord pour avoir le nombre de mouvements concernés
            $countSql = $this->cnx->prepare('SELECT COUNT(*) FROM mouvement WHERE date < :cutoffDate');
            $countSql->bindParam(':cutoffDate', $cutoffDate);
            $countSql->execute();
            $count = $countSql->fetchColumn();
            
            // Si aucun mouvement à supprimer, retourner 0
            if ($count == 0) {
                return 0;
            }
            
            // Enregistrer les IDs des mouvements à supprimer dans un journal (optionnel)
            $logSql = $this->cnx->prepare('SELECT id, nom, prenom, date FROM mouvement WHERE date < :cutoffDate');
            $logSql->bindParam(':cutoffDate', $cutoffDate);
            $logSql->execute();
            $toDelete = $logSql->fetchAll(PDO::FETCH_ASSOC);
            
            // Consigner les IDs dans le journal système
            error_log("Mouvements à supprimer: " . json_encode($toDelete));
            
            // Effectuer la suppression
            $sql = $this->cnx->prepare('DELETE FROM mouvement WHERE date < :cutoffDate');
            $sql->bindParam(':cutoffDate', $cutoffDate);
            $sql->execute();
            
            // Journaliser le résultat
            error_log("Suppression terminée: $count mouvements supprimés");
            
            // Journaliser l'opération si les informations utilisateur sont disponibles
            if ($userId && $username) {
                $details = "Suppression des mouvements datant d'avant $cutoffDate";
                $this->logArchiveOperation($userId, $username, $details, $count);
            }
            
            return $count;
        } catch (PDOException $e) {
            error_log("Erreur SQL dans deleteOlderThan: " . $e->getMessage());
            throw new Exception("Erreur lors de la suppression des anciens mouvements: " . $e->getMessage());
        }
    }


    private function logArchiveOperation($userId, $username, $details, $affectedRecords) {
        try {
            
            $sql = $this->cnx->prepare(
                'INSERT INTO operation_log (operation_type, user_id, username, operation_details, affected_records) 
                 VALUES (:operation_type, :user_id, :username, :details, :affected_records)'
            );
            
            $operationType = 'archive_deletion';
            
            $sql->bindValue(':operation_type', $operationType);
            $sql->bindValue(':user_id', $userId, PDO::PARAM_INT);
            $sql->bindValue(':username', $username);
            $sql->bindValue(':details', $details);
            $sql->bindValue(':affected_records', $affectedRecords, PDO::PARAM_INT);
            
            $result = $sql->execute();
            
            error_log("Opération d'archivage journalisée: " . ($result ? 'Succès' : 'Échec'));
            
            return $result;
        } catch (PDOException $e) {
            error_log("Erreur lors de la journalisation: " . $e->getMessage());
            return false; // La journalisation ne doit pas bloquer l'opération principale
        }
    }

    public function toggleChecked($id, $checked, $username) {
        try {
            $sql = $this->cnx->prepare('UPDATE mouvement SET checked = :checked, checked_by = :checked_by WHERE id = :id');
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
        $sql = $this->cnx->prepare('SELECT COUNT(*) as total FROM mouvement WHERE checked = 0');
        $sql->execute();
        return (int)$sql->fetch(PDO::FETCH_ASSOC)['total'];
    } catch (PDOException $e) {
        error_log("Erreur SQL dans countUnvalidated: " . $e->getMessage());
        return 0;
    }
}

public function getStatsByType($fromDate) {
    try {
        $sql = $this->cnx->prepare('
            SELECT 
                type, 
                COUNT(*) as count 
            FROM 
                mouvement 
            WHERE 
                date >= :fromDate 
            GROUP BY 
                type
        ');
        
        $sql->bindParam(':fromDate', $fromDate);
        $sql->execute();
        
        return $sql->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        error_log("Erreur SQL dans getStatsByType: " . $e->getMessage());
        throw new Exception("Erreur lors de la récupération des statistiques par type: " . $e->getMessage());
    }
}

public function getUpcomingMovements() {
    try {
        // Récupérer les mouvements à venir avec le statut checked
        $sql = $this->cnx->prepare('
            SELECT 
                m.id, 
                m.nom, 
                m.prenom, 
                m.date, 
                m.time, 
                m.type, 
                m.checked,
                m.checked_by AS checkedBy,
                DATEDIFF(m.date, CURDATE()) as days_until
            FROM mouvement m 
            WHERE m.date >= CURDATE()
            ORDER BY m.date ASC, m.time ASC
            LIMIT 10
        ');
        
        $sql->execute();
        $mouvements = $sql->fetchAll(PDO::FETCH_ASSOC);
        
        // Calculer des statistiques sur les échéances
        $minDays = PHP_INT_MAX;
        $maxDays = 0;
        $totalDays = 0;
        $count = count($mouvements);
        
        if ($count > 0) {
            foreach ($mouvements as $m) {
                $days = (int)$m['days_until'];
                $minDays = min($minDays, $days);
                $maxDays = max($maxDays, $days);
                $totalDays += $days;
                
                // Convertir la valeur checked en booléen explicite
                $m['checked'] = (bool)$m['checked'];
            }
            
            $avgDays = $totalDays / $count;
        } else {
            $minDays = 0;
            $maxDays = 0;
            $avgDays = 0;
        }
        
        return [
            'summary' => [
                'count' => $count,
                'min_days' => $minDays === PHP_INT_MAX ? 0 : $minDays,
                'max_days' => $maxDays,
                'avg_days' => $avgDays
            ],
            'upcoming' => $mouvements
        ];
        
    } catch (PDOException $e) {
        error_log("Erreur SQL dans getUpcomingMovements: " . $e->getMessage());
        throw new Exception("Erreur lors de la récupération des mouvements à venir: " . $e->getMessage());
    }
}






}
