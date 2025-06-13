<?php

require_once "Controller.php";
require_once "Repository/MouvementRepository.php";
require_once "Repository/DecesRepository.php";
require_once "Controller/MouvementController.php";
require_once "Controller/DecesController.php";
require_once "Controller/UserController.php";

class UnifiedHistoryController extends Controller {

    private MouvementRepository $mouvements;
    private DecesRepository $deces;
    private UserController $userController;
    private MouvementController $mouvementController;
    private DecesController $decesController;

    public function __construct() {
        $this->mouvements = new MouvementRepository();
        $this->deces = new DecesRepository();
        $this->userController = new UserController();
        $this->mouvementController = new MouvementController();
        $this->decesController = new DecesController();
    }

    protected function processGetRequest(HttpRequest $request) {
        try {
            // Extraire le token des en-têtes HTTP
            $headers = getallheaders();
            $authHeader = $headers['Authorization'] ?? '';
            
            if (empty($authHeader) || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
                throw new Exception("Token d'authentification manquant ou invalide.");
            }
            
            // Vérifier le token avec le UserController
            $token = $matches[1];
            $tokenData = $this->userController->verifyTokenAndGetUser($token);
            
            if (!$tokenData) {
                throw new Exception("Token d'authentification invalide.");
            }
            
            // Vérifier si c'est un endpoint spécial pour compter les éléments non validés
            if ($request->getId() === 'count-unvalidated') {
                // Compter les mouvements non validés
                $mouvementsCount = $this->mouvements->countUnvalidated();
                
                // Compter les décès non validés
                $decesCount = $this->deces->countUnvalidated();
                
                // Retourner le total
                return [
                    'status' => 'success',
                    'data' => [
                        'count' => $mouvementsCount + $decesCount,
                        'mouvements' => $mouvementsCount,
                        'deces' => $decesCount
                    ]
                ];
            }
            
            // Récupérer les paramètres
            $page = (int)($request->getParam('page') ?? 1);
            $limit = (int)($request->getParam('limit') ?? 10);
            $sortOrder = $request->getParam('sort') ?? 'desc';
            $type = $request->getParam('type') ?? '';
            $dateFrom = $request->getParam('dateFrom') ?? '';
            $dateTo = $request->getParam('dateTo') ?? '';
            $checkStatus = $request->getParam('checkStatus') ?? 'unchecked'; // Par défaut, on affiche les éléments non validés
            
            // Recherche par nom ou prénom
            $searchQuery = $request->getParam('q') ?? '';
            
            // Récupérer les mouvements si le type n'est pas spécifiquement "deces"
            $mouvements = [];
            $totalMouvements = 0;

            if ($searchQuery && strlen($searchQuery) >= 3) {
            // Récupérer les mouvements qui correspondent à la recherche
            if ($type !== 'Décès') {
                $mouvementResult = $this->mouvements->search(
                    $searchQuery, $sortOrder, 1, 1000, $type, $dateFrom, $dateTo, null, $checkStatus
                );
                
                if (isset($mouvementResult['items'])) {
                    $mouvements = $mouvementResult['items'];
                    $totalMouvements = $mouvementResult['totalItems'] ?? count($mouvements);
                }
            }
            
            // Récupérer les décès qui correspondent à la recherche
            if ($type !== 'Entrée' && $type !== 'Sortie' && $type !== 'Transfert') {
                $decesResult = $this->deces->search(
                    $searchQuery, $sortOrder, 1, 1000, $dateFrom, $dateTo, null, $checkStatus
                );
                
                if (isset($decesResult['items'])) {
                    $deces = $decesResult['items'];
                    $totalDeces = $decesResult['totalItems'] ?? count($deces);
                }
            }
        }
            
            if ($type !== 'Décès') {
                // Déterminer le type de mouvement à rechercher
                $mouvementType = '';
                if (in_array($type, ['Entrée', 'Sortie', 'Transfert'])) {
                    $mouvementType = $type;
                }
                
                // Appeler le repository pour récupérer les mouvements
                if ($searchQuery) {
                    $mouvementResult = $this->mouvements->search(
                        $searchQuery, $sortOrder, 1, 1000, $mouvementType, $dateFrom, $dateTo, null, $checkStatus
                    );
                } else {
                    $mouvementResult = $this->mouvements->findAll(
                        $sortOrder, 1, 1000, $mouvementType, $dateFrom, $dateTo, null, $checkStatus
                    );
                }
                
                if (isset($mouvementResult['items'])) {
                    $mouvements = $mouvementResult['items'];
                    $totalMouvements = $mouvementResult['totalItems'] ?? count($mouvements);
                }
            }

            
            
            // Récupérer les décès si le type n'est pas spécifiquement "mouvement"
            $deces = [];
            $totalDeces = 0;
            
            // Dans la section où vous recherchez les décès
            if ($type !== 'Entrée' && $type !== 'Sortie' && $type !== 'Transfert') {
                // Appeler le repository pour récupérer les décès
                if ($searchQuery) {
                    $decesResult = $this->deces->search(
                        $searchQuery, $sortOrder, 1, 1000, $dateFrom, $dateTo, null, $checkStatus
                    );
                } else {
                    $decesResult = $this->deces->findAll(
                        $sortOrder, 1, 1000, $dateFrom, $dateTo, null, $checkStatus
                    );
                }
                
                if (isset($decesResult['items'])) {
                    $deces = $decesResult['items'];
                    $totalDeces = $decesResult['totalItems'] ?? count($deces);
                }
            }
            
            // Fusionner et transformer les résultats
            $unifiedItems = [];
            
            // Transformer les mouvements
            foreach ($mouvements as $mouvement) {
                $unifiedItems[] = $this->transformMouvement($mouvement);
            }
            
            // Transformer les décès
            foreach ($deces as $decesItem) {
                $unifiedItems[] = $this->transformDeces($decesItem);
            }
            
            // Trier les résultats combinés par date
            usort($unifiedItems, function($a, $b) use ($sortOrder) {
                $dateA = strtotime($a['date'] . ' ' . ($a['time'] ?? '00:00:00'));
                $dateB = strtotime($b['date'] . ' ' . ($b['time'] ?? '00:00:00'));
                
                if ($sortOrder === 'asc') {
                    return $dateA - $dateB;
                } else {
                    return $dateB - $dateA;
                }
            });
            
            // Pagination manuelle des résultats combinés
            $totalItems = count($unifiedItems);
            $totalPages = ceil($totalItems / $limit);
            
            $startIndex = ($page - 1) * $limit;
            $paginatedItems = array_slice($unifiedItems, $startIndex, $limit);
            
            return [
                'status' => 'success',
                'data' => [
                    'items' => $paginatedItems,
                    'totalItems' => $totalItems,
                    'totalPages' => $totalPages,
                    'currentPage' => $page
                ]
            ];
            
        } catch (Exception $e) {
            error_log("Erreur dans UnifiedHistoryController->processGetRequest: " . $e->getMessage());
            return [
                'status' => 'error',
                'message' => $e->getMessage()
            ];
        }
    }
    
    protected function processPutRequest(HttpRequest $request) {
            try {
                // Extraire le token des en-têtes HTTP
                $headers = getallheaders();
                $authHeader = $headers['Authorization'] ?? '';
                
                if (empty($authHeader) || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
                    throw new Exception("Token d'authentification manquant ou invalide.");
                }
                
                // Vérifier le token avec le UserController
                $token = $matches[1];
                $tokenData = $this->userController->verifyTokenAndGetUser($token);
                
                if (!$tokenData) {
                    throw new Exception("Token d'authentification invalide.");
                }
                
                // Nous ne vérifions plus que l'utilisateur appartient au service Accueil
                // La vérification des permissions est gérée par les contrôleurs spécifiques
                
                $id = $request->getId();
                $type = $request->getParam('type');
                
                if (!$id || !$type) {
                    throw new Exception("Identifiant ou type manquant.");
                }
                
                $data = json_decode($request->getJson(), true);
                $checked = isset($data['checked']) ? (bool)$data['checked'] : false;
                
                // Selon le type, rediriger vers le contrôleur approprié
                if ($type === 'mouvement') {
                    $result = $this->mouvements->toggleChecked($id, $checked, $tokenData['username']);
                } elseif ($type === 'deces') {
                    $result = $this->deces->toggleChecked($id, $checked, $tokenData['username']);
                } else {
                    throw new Exception("Type non reconnu: $type");
                }
                
                if ($result) {
                    return [
                        'status' => 'success',
                        'message' => "Statut mis à jour avec succès."
                    ];
                } else {
                    throw new Exception("Échec de la mise à jour du statut.");
                }
                
            } catch (Exception $e) {
                error_log("Erreur dans UnifiedHistoryController->processPutRequest: " . $e->getMessage());
                return [
                    'status' => 'error',
                    'message' => $e->getMessage()
                ];
            }
        }
    
    // Transformer un objet Mouvement en format unifié
    private function transformMouvement($mouvement) {
        $data = $mouvement;
        
        // Si c'est un objet, le convertir en tableau
        if (is_object($mouvement)) {
            $data = json_decode(json_encode($mouvement), true);
        }
        
        // Déterminer l'emplacement à afficher
        $location = $this->determineMouvementLocation($data);
        
        return [
            'id' => $data['id'],
            'type' => 'mouvement',
            'subType' => $data['type'],
            'nom' => $data['nom'],
            'nom_naissance' => $data['nom_naissance'],
            'prenom' => $data['prenom'],
            'naissance' => $data['naissance'],
            'sex' => $data['sex'],
            'date' => $data['date'],
            'time' => $data['time'],
            'location' => $location,
            'details' => $data,
            'checked' => isset($data['checked']) ? (bool)$data['checked'] : false,
            'checkedBy' => $data['checkedBy'] ?? $data['checked_by'] ?? null
        ];
    }
    
    // Transformer un objet Deces en format unifié
    private function transformDeces($deces) {
            $data = $deces;
            
            // Si c'est un objet, le convertir en tableau
            if (is_object($deces)) {
                $data = json_decode(json_encode($deces), true);
            }
            
            // Pour les décès, on utilise chambre comme emplacement
            $location = $data['chambre'];
            if (!empty($data['section'])) {
                $location .= ' (' . $data['section'] . ')';
            }
            
            return [
                'id' => $data['id'],
                'type' => 'deces',
                'subType' => 'Décès', // Important: Utiliser 'Décès' au lieu de 'Deces' pour correspondre au filtre
                'nom' => $data['nom'],
                'nom_naissance' => $data['nom_naissance'],
                'prenom' => $data['prenom'],
                'naissance' => $data['naissance'],
                'sex' => $data['sex'],
                'date' => $data['date_deces'],
                'time' => $data['heure_deces'],
                'location' => $location,
                'details' => $data,
                'checked' => isset($data['checked']) ? (bool)$data['checked'] : false,
                'checkedBy' => $data['checkedBy'] ?? $data['checked_by'] ?? null
            ];
        }
    
    // Déterminer l'emplacement à afficher pour un mouvement
    private function determineMouvementLocation($mouvement) {
        $locationType = $mouvement['type'];
        
        if ($locationType === 'Entrée') {
            // Pour une entrée, afficher la destination
            if (!empty($mouvement['chambreArrivee'])) {
                if (!empty($mouvement['sectionArrivee'])) {
                    return $mouvement['chambreArrivee'] . ' (' . $mouvement['sectionArrivee'] . ')';
                }
                return $mouvement['chambreArrivee'];
            }
            return $mouvement['lieuArrivee'] ?? 'N/A';
        } else {
            // Pour une sortie ou un transfert, afficher la provenance
            if (!empty($mouvement['chambreDepart'])) {
                if (!empty($mouvement['sectionDepart'])) {
                    return $mouvement['chambreDepart'] . ' (' . $mouvement['sectionDepart'] . ')';
                }
                return $mouvement['chambreDepart'];
            }
            return $mouvement['lieuDepart'] ?? 'N/A';
        }
    }

    protected function processPostRequest(HttpRequest $request) {
        return [
            'status' => 'error',
            'message' => 'Méthode POST non supportée pour cette ressource.'
        ];
    }

    protected function processDeleteRequest(HttpRequest $request) {
        return [
            'status' => 'error',
            'message' => 'Méthode DELETE non supportée pour cette ressource.'
        ];
    }
}