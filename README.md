# Documentation technique - Application Mouvement

## Présentation générale

L'application Mouvement est un système de gestion des mouvements de résidents dans un établissement de santé. Elle permet de suivre les entrées, sorties et transferts de résidents, ainsi que l'enregistrement des décès. L'application est conçue avec une interface web moderne et un système d'authentification sécurisé via LDAP (Active Directory).

## Architecture technique

### Frontend (Client)
- Développé en **React.js** avec **Vite**
- Utilise **React Router** pour la navigation
- Styling avec **Tailwind CSS**
- Communication avec l'API via des requêtes fetch encapsulées

### Backend (API)
- Développé en **PHP**
- Architecture MVC (Model-View-Controller)
- Base de données **MySQL**
- Système d'authentification via LDAP et jetons (tokens) JWT

## Fonctionnalités principales

### 1. Authentification et sécurité
- Connexion via Active Directory (LDAP)
- Système de tokens JWT pour maintenir la session
- Routes protégées par authentification
- Autorisations basées sur les services et permissions

### 2. Gestion des mouvements
- Enregistrement des entrées de résidents
- Enregistrement des sorties de résidents
- Suivi des transferts internes
- Historique complet des mouvements

### 3. Registre des décès
- Enregistrement des décès
- Consultation de l'historique des décès

### 4. Administration
- Gestion des utilisateurs et services
- Gestion des emplacements (chambres, établissements)
- Configuration des permissions par service
- Archivage des anciennes données

## Configuration du serveur

### Prérequis
- Serveur web (Apache/Nginx)
- PHP 7.4 ou supérieur
- MySQL 5.7 ou supérieur
- Extension PHP LDAP activée
- Accès au serveur LDAP/Active Directory

### Déploiement
1. Configurer le serveur web pour pointer vers le dossier du projet
2. Configurer l'accès à la base de données dans `api/Repository/EntityRepository.php`
3. Configurer les paramètres LDAP dans `api/Controller/UserController.php`
4. Configurer l'URL de l'API dans `client/lib/api-request.js`

## Structure du code

### API PHP

#### Contrôleurs
- **UserController.php** - Gestion des utilisateurs et authentification
- **MouvementController.php** - CRUD des mouvements
- **DecesController.php** - CRUD des décès
- **LocationController.php** - Gestion des emplacements
- **AdminController.php** - Fonctionnalités administratives

#### Repositories
- **EntityRepository.php** - Classe de base pour l'accès à la base de données
- **UserRepository.php** - Accès aux données utilisateurs
- **MouvementRepository.php** - Accès aux données mouvements
- **DecesRepository.php** - Accès aux données décès
- **LocationRepository.php** - Accès aux données emplacements
- **PermissionRepository.php** - Accès aux données de permissions

#### Classes (Modèles)
- **Entity.php** - Classe de base pour les entités
- **User.php** - Modèle utilisateur
- **Mouvement.php** - Modèle mouvement
- **Deces.php** - Modèle décès
- **HttpRequest.php** - Traitement des requêtes HTTP

### Client React

#### Composants principaux
- **Protection/** - Composants de protection des routes
- **Mouvement/** - Composants liés aux mouvements
- **Deces/** - Composants liés aux décès
- **Admin/** - Composants d'administration
- **Form/** - Composants de formulaires partagés
- **ui/** - Composants UI génériques

#### Librairies et utilitaires
- **lib/api-request.js** - Utilitaire pour les appels API
- **lib/date.js** - Fonctions de manipulation des dates
- **lib/usePermissions.js** - Hook pour la gestion des permissions

#### Routes
- **login.jsx** - Page de connexion
- **home.jsx** - Page d'accueil
- **mouvementList.jsx** - Liste des mouvements
- **mouvementForm.jsx** - Formulaire d'ajout de mouvement
- **decesList.jsx** - Liste des décès
- **decesForm.jsx** - Formulaire d'ajout de décès

## Système de permissions

L'application utilise un système de permissions avancé qui permet de contrôler précisément ce que chaque service peut faire :

| Permission | Description |
|------------|-------------|
| viewHistory | Consulter l'historique des mouvements |
| createMovement | Créer des mouvements |
| viewDeathRecords | Consulter le registre des décès |
| createDeathRecord | Ajouter des décès |
| deleteMovement | Supprimer des mouvements |
| adminAccess | Accès au panneau d'administration |
| manageArchives | Gérer les archives |

Les services prédéfinis incluent:
- **Admin** - Toutes les permissions
- **Accueil** - Gestion des entrées/sorties
- **Cadre de Santé** - Permissions médicales spécifiques

## Configuration de l'authentification

### Paramètres LDAP

Le système utilise l'authentification LDAP (Active Directory). Les paramètres sont configurés dans `api/Controller/UserController.php` :

```php
private $ldapServer = "ldap://10.84.15.1:389"; // Serveur LDAP
private $ldapDomain = "hl-stleonard.fr"; // Domaine LDAP
```

### Gestion des tokens

La sécurité des sessions repose sur des tokens JWT. Le secret utilisé pour signer ces tokens est défini dans `UserController.php` :

```php
private string $secretKey = "votre_clé_secrète_très_complexe_à_changer_en_production";
private int $tokenExpiration = 3600; // 1 heure en secondes
```

**Important** : Modifiez la clé secrète lors du déploiement en production.

## Base de données

### Configuration

La configuration de connexion à la base de données se trouve dans `api/Repository/EntityRepository.php` :

```php
protected function __construct(){
    $this->cnx = new PDO("mysql:host=localhost;port=3306;dbname=mouvement", "pma-admin", "pmaadmin");
}
```

**Important** : Modifiez ces informations selon votre environnement.

### Structure des tables principales

- **user** - Utilisateurs de l'application
- **mouvement** - Enregistrements des mouvements
- **deces** - Registre des décès
- **location** - Emplacements (chambres et établissements)
- **service_permissions** - Permissions par service

## URL de l'API

L'URL de l'API est configurée dans `client/lib/api-request.js` :

```javascript
const API_BASE_URL = 'http://10.84.84.196:83/api';
```

**Important** : Modifiez cette URL selon votre environnement.

## Maintenance et dépannage

### Problèmes courants

1. **Problèmes d'authentification** :
   - Vérifier la configuration LDAP
   - Vérifier les logs PHP pour les erreurs de connexion LDAP

2. **Problèmes d'accès aux fonctionnalités** :
   - Vérifier les permissions associées au service de l'utilisateur
   - Consulter la table `service_permissions` dans la base de données

3. **Erreurs API** :
   - Vérifier les logs du serveur web
   - Vérifier la connexion à la base de données

### Sauvegarde

Il est recommandé d'effectuer des sauvegardes régulières de la base de données, en particulier avant toute mise à jour du système.

## Personnalisation et évolutions

### Ajout de nouvelles permissions

Pour ajouter une nouvelle permission :

1. Définir la permission dans `client/config/permissions.js`
2. Mettre à jour l'interface d'administration des permissions
3. Ajouter la vérification de permission dans les composants concernés

### Ajout d'un nouveau service

Les services sont gérés dans la base de données. Pour ajouter un nouveau service, utilisez l'interface d'administration ou ajoutez directement un utilisateur avec ce service dans la table `user`.

### Ajout de nouveaux types de mouvements

Les types de mouvements sont définis dans le code. Pour ajouter un nouveau type, vous devrez mettre à jour les composants et les contrôleurs concernés.

## Contact et support

Pour toute question ou support concernant cette application, veuillez contacter le service informatique.

---