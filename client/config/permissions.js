/**
 * Liste des permissions disponibles dans le système
 * Cette liste est utilisée uniquement pour l'interface d'administration
 * Les permissions réelles sont stockées en base de données
 */

export function getAllPermissions() {
  return {
    viewHistory: "Voir l'historique des mouvements",
    createMovement: "Créer des mouvements",
    viewDeathRecords: "Voir le registre des décès",
    createDeathRecord: "Ajouter des décès",
    deleteMovement: "Supprimer des mouvements",
    adminAccess: "Accès à l'administration",
    manageArchives: "Gérer les archives de mouvements",
    checkMovement: "Cocher les mouvements",
    viewUnifiedHistory: "Accès à l'historique unifié entre mouvements et décés",
    printData: "Imprimer les données (mouvements et décés)",
    viewStatistics: "Accès aux statistiques du système"
  };
}