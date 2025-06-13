<?php
require_once "Repository/EntityRepository.php";

class NoMovementDaysRepository extends EntityRepository {

    public function __construct() {
        parent::__construct();
    }

    public function find($date, $service = null) {
        try {
            if ($service) {
                // Recherche avec date et service spécifiques
                $sql = $this->cnx->prepare('SELECT * FROM no_movement_days WHERE date = :date AND service = :service');
                $sql->bindParam(':date', $date);
                $sql->bindParam(':service', $service);
            } else {
                // Recherche par date uniquement
                $sql = $this->cnx->prepare('SELECT * FROM no_movement_days WHERE date = :date');
                $sql->bindParam(':date', $date);
            }
            $sql->execute();
            
            return $sql->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Erreur SQL dans NoMovementDaysRepository::find: " . $e->getMessage());
            throw new Exception("Erreur lors de la récupération des jours sans mouvement: " . $e->getMessage());
        }
    }

    public function findAll() {
        try {
            $sql = $this->cnx->prepare('SELECT * FROM no_movement_days ORDER BY date DESC, service ASC');
            $sql->execute();
            
            return $sql->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Erreur SQL dans NoMovementDaysRepository::findAll: " . $e->getMessage());
            throw new Exception("Erreur lors de la récupération des jours sans mouvement: " . $e->getMessage());
        }
    }

    public function findActive() {
        try {
            // Récupérer uniquement les enregistrements pour la date du jour
            $today = date('Y-m-d');
            $sql = $this->cnx->prepare('SELECT * FROM no_movement_days WHERE date = :today');
            $sql->bindParam(':today', $today);
            $sql->execute();
            
            return $sql->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Erreur SQL dans NoMovementDaysRepository::findActive: " . $e->getMessage());
            throw new Exception("Erreur lors de la récupération des jours sans mouvement: " . $e->getMessage());
        }
    }

    public function save($data) {
        try {
            // Vérifier si un enregistrement existe déjà pour cette date et ce service
            $existing = $this->find($data['date'], $data['service']);
            if ($existing) {
                return false; // Un enregistrement existe déjà pour cette date et ce service
            }
            
            $sql = $this->cnx->prepare('INSERT INTO no_movement_days (date, service, created_by) VALUES (:date, :service, :created_by)');
            $sql->bindParam(':date', $data['date']);
            $sql->bindParam(':service', $data['service']);
            $sql->bindParam(':created_by', $data['created_by']);
            
            return $sql->execute();
        } catch (PDOException $e) {
            error_log("Erreur SQL dans NoMovementDaysRepository::save: " . $e->getMessage());
            throw new Exception("Erreur lors de l'enregistrement du jour sans mouvement: " . $e->getMessage());
        }
    }
    
    public function delete($date, $service = null) {
        try {
            if ($service) {
                // Suppression d'un enregistrement spécifique (date + service)
                $sql = $this->cnx->prepare('DELETE FROM no_movement_days WHERE date = :date AND service = :service');
                $sql->bindParam(':date', $date);
                $sql->bindParam(':service', $service);
            } else {
                // Suppression de tous les enregistrements pour une date
                $sql = $this->cnx->prepare('DELETE FROM no_movement_days WHERE date = :date');
                $sql->bindParam(':date', $date);
            }
            
            return $sql->execute();
        } catch (PDOException $e) {
            error_log("Erreur SQL dans NoMovementDaysRepository::delete: " . $e->getMessage());
            throw new Exception("Erreur lors de la suppression du jour sans mouvement: " . $e->getMessage());
        }
    }

    public function update($entity) {
        // Non nécessaire pour cette fonctionnalité
        return false;
    }
}