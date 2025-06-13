<?php
require_once "Repository/EntityRepository.php";

class UserPreferencesRepository extends EntityRepository {

    public function __construct() {
        parent::__construct();
    }

    public function find($userId) {
        try {
            $sql = $this->cnx->prepare('SELECT * FROM user_preferences WHERE user_id = :userId');
            $sql->bindParam(':userId', $userId);
            $sql->execute();
            
            $result = $sql->fetch(PDO::FETCH_ASSOC);
            if ($result) {
                return $result;
            }
            
            // Si aucune préférence n'est trouvée, retourner les valeurs par défaut
            return [
                'user_id' => $userId,
                'notification_type' => $this->getDefaultNotificationType($userId),
                'email' => null,
                'theme' => 'light'
            ];
            
        } catch (PDOException $e) {
            error_log("Erreur SQL dans UserPreferencesRepository::find: " . $e->getMessage());
            throw new Exception("Erreur lors de la récupération des préférences utilisateur: " . $e->getMessage());
        }
    }
    
    private function getDefaultNotificationType($userId) {
        try {
            // Récupérer le service de l'utilisateur
            $sql = $this->cnx->prepare('SELECT service FROM user WHERE id = :userId');
            $sql->bindParam(':userId', $userId);
            $sql->execute();
            $result = $sql->fetch(PDO::FETCH_ASSOC);
            
            if ($result && $result['service'] === 'Accueil') {
                return 'all';
            }
            
            return 'never';
        } catch (PDOException $e) {
            error_log("Erreur SQL dans getDefaultNotificationType: " . $e->getMessage());
            return 'never'; // Par défaut
        }
    }
    
    public function save($preferences) {
    try {
        // Vérifier si les préférences existent déjà
        $checkSql = $this->cnx->prepare('SELECT COUNT(*) FROM user_preferences WHERE user_id = :userId');
        $checkSql->bindParam(':userId', $preferences['user_id']);
        $checkSql->execute();
        
        if ($checkSql->fetchColumn() > 0) {
            // Mettre à jour les préférences existantes
            $sql = $this->cnx->prepare('
                UPDATE user_preferences 
                SET notification_type = :notificationType, email = :email, updated_at = NOW()
                WHERE user_id = :userId
            ');
        } else {
            // Insérer de nouvelles préférences
            $sql = $this->cnx->prepare('
                INSERT INTO user_preferences (user_id, notification_type, email)
                VALUES (:userId, :notificationType, :email)
            ');
        }
        
        $sql->bindParam(':userId', $preferences['user_id']);
        $sql->bindParam(':notificationType', $preferences['notification_type']);
        $sql->bindParam(':email', $preferences['email']);
        
        return $sql->execute();
        
    } catch (PDOException $e) {
        error_log("Erreur SQL dans UserPreferencesRepository::save: " . $e->getMessage());
        throw new Exception("Erreur lors de la sauvegarde des préférences utilisateur: " . $e->getMessage());
    }
}

    public function findAll() {
        try {
            $sql = $this->cnx->prepare('
                SELECT up.*, u.username 
                FROM user_preferences up
                JOIN user u ON u.id = up.user_id
            ');
            $sql->execute();
            return $sql->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Erreur SQL dans UserPreferencesRepository::findAll: " . $e->getMessage());
            throw new Exception("Erreur lors de la récupération des préférences: " . $e->getMessage());
        }
    }

    public function delete($userId) {
        try {
            $sql = $this->cnx->prepare('DELETE FROM user_preferences WHERE user_id = :userId');
            $sql->bindParam(':userId', $userId);
            $sql->execute();
            return $sql->rowCount() > 0;
        } catch (PDOException $e) {
            error_log("Erreur SQL dans UserPreferencesRepository::delete: " . $e->getMessage());
            throw new Exception("Erreur lors de la suppression des préférences utilisateur: " . $e->getMessage());
        }
    }

    public function update($preferences) {
        return $this->save($preferences);
    }
    
    public function getNotificationRecipients($notificationType) {
        try {
            $sql = $this->cnx->prepare('
                SELECT up.email, u.username
                FROM user_preferences up
                JOIN user u ON u.id = up.user_id
                WHERE up.notification_type = :notificationType OR up.notification_type = \'all\'
            ');
            $sql->bindParam(':notificationType', $notificationType);
            $sql->execute();
            return $sql->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Erreur SQL dans getNotificationRecipients: " . $e->getMessage());
            throw new Exception("Erreur lors de la récupération des destinataires: " . $e->getMessage());
        }
    }
}
?>