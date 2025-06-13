<?php
require_once "Repository/EntityRepository.php";

class PermissionRepository extends EntityRepository {

    public function __construct() {
        parent::__construct();
    }

   /**
     * Obtenir les permissions d'un service
     */
    public function getServicePermissions($serviceName) {
        try {
            error_log("PermissionRepository: Récupération des permissions pour le service: " . $serviceName);
            
            $sql = $this->cnx->prepare('SELECT permission_key, value FROM service_permissions WHERE service_name = :service');
            $sql->bindParam(':service', $serviceName);
            $sql->execute();
            $results = $sql->fetchAll(PDO::FETCH_ASSOC);
            
            error_log("PermissionRepository: Nombre de permissions trouvées: " . count($results));
            
            $permissions = [];
            foreach ($results as $row) {
                $permissions[$row['permission_key']] = (bool)$row['value'];
                error_log("Permission trouvée: {$row['permission_key']} = " . ($row['value'] ? 'true' : 'false'));
            }
            
            error_log("PermissionRepository: Permissions finales: " . json_encode($permissions));
            return $permissions;
        } catch (PDOException $e) {
            error_log("Erreur SQL dans getServicePermissions: " . $e->getMessage());
            throw new Exception("Erreur lors de la récupération des permissions: " . $e->getMessage());
        }
    }

    /**
     * Mettre à jour les permissions d'un service
     */
    public function updateServicePermissions($serviceName, $permissions) {
        try {
            // Commencer une transaction
            $this->cnx->beginTransaction();
            
            // Supprimer les permissions existantes
            $sql = $this->cnx->prepare('DELETE FROM service_permissions WHERE service_name = :service');
            $sql->bindParam(':service', $serviceName);
            $sql->execute();
            
            // Insérer les nouvelles permissions
            $sql = $this->cnx->prepare('
                INSERT INTO service_permissions (service_name, permission_key, value)
                VALUES (:service, :key, :value)
            ');
            
            foreach ($permissions as $key => $value) {
                $sql->bindParam(':service', $serviceName);
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
            
            error_log("Erreur SQL dans updateServicePermissions: " . $e->getMessage());
            throw new Exception("Erreur lors de la mise à jour des permissions: " . $e->getMessage());
        }
    }

      /**
     * Récupérer toutes les clés de permissions dans le système
     */
    public function getAllPermissionKeys() {
        try {
            $sql = $this->cnx->prepare('SELECT DISTINCT permission_key FROM service_permissions ORDER BY permission_key');
            $sql->execute();
            return $sql->fetchAll(PDO::FETCH_COLUMN);
        } catch (PDOException $e) {
            error_log("Erreur SQL dans getAllPermissionKeys: " . $e->getMessage());
            throw new Exception("Erreur lors de la récupération des clés de permissions: " . $e->getMessage());
        }
    }


    // Implémentation des méthodes abstraites requises
    public function find($id) {
        // Non utilisé dans ce contexte
        return null;
    }

    public function findAll() {
        // Non utilisé dans ce contexte
        return [];
    }

    public function save($entity) {
        // Non utilisé dans ce contexte
        return false;
    }

    public function delete($id) {
        // Non utilisé dans ce contexte
        return false;
    }

    public function update($entity) {
        // Non utilisé dans ce contexte
        return false;
    }
}