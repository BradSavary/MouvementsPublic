import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { addMouvement } from '../../../../data/mouvement-data';
import { getLocations } from '../../../../data/location-data';
import { FormPersonInfo } from '../../Form/FormPersonInfo';
import { FormOriginDestination } from '../../Form/FormOriginDestination';
import { FormDurationSelection } from '../../Form/FormDurationSelect';
import { ConfirmationModal } from './ConfirmationModal';
import { usePermissions } from '../../../../lib/usePermissions';

export function MouvementForm() {
    const { userData } = useOutletContext();
    const navigate = useNavigate();
    const { canCreateMovementType } = usePermissions();
    
    // État du formulaire
    const [formData, setFormData] = useState({
        nom: '',
        nom_naissance: '',
        prenom: '',
        naissance: '',
        sex: 'Homme',
        type: '',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().substring(0, 5),
        provenance: '',
        destination: '',
        sejour: 'indéterminé',
        dureeType: 'indéterminé',
        dateFin: ''
    });

    // États pour l'interface
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [locations, setLocations] = useState({ rooms: [], facilities: [], all: [] });
    const [loadingLocations, setLoadingLocations] = useState(false);
    const [mouvementTypeDetected, setMouvementTypeDetected] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    
    // Appliquer des restrictions en fonction du service
    useEffect(() => {
        if (mouvementTypeDetected && !canCreateMovementType(mouvementTypeDetected)) {
            setError(`Vous n'êtes pas autorisé à créer un mouvement de type ${mouvementTypeDetected}`);
        } else {
            setError('');
        }
    }, [mouvementTypeDetected, canCreateMovementType]);

    // Charger les emplacements au chargement
    useEffect(() => {
        const fetchLocations = async () => {
            setLoadingLocations(true);
            try {
                const response = await getLocations();
                if (response.status === 'success') {
                    setLocations(response.data);
                } else {
                    setError('Erreur lors du chargement des emplacements');
                }
            } catch (err) {
                setError('Erreur lors du chargement des emplacements');
                console.error(err);
            } finally {
                setLoadingLocations(false);
            }
        };

        fetchLocations();
    }, []);

    // Détecter automatiquement le type de mouvement
    useEffect(() => {
  // Ajouter un délai pour éviter la détection trop rapide pendant la saisie
  const timer = setTimeout(() => {
    if (formData.provenance && formData.destination) {
      console.log("Détection du type de mouvement - Provenance et destination remplies");
      if (isExistingRoom(formData.provenance) && isExistingRoom(formData.destination)) {
        console.log("  -> Détecté: Transfert (chambre vers chambre)");
        setMouvementTypeDetected('Transfert');
      } else if (isExistingRoom(formData.provenance) && !isExistingRoom(formData.destination)) {
        console.log("  -> Détecté: Sortie (chambre vers externe)");
        setMouvementTypeDetected('Sortie');
      } else if (!isExistingRoom(formData.provenance) && isExistingRoom(formData.destination)) {
        console.log("  -> Détecté: Entrée (externe vers chambre)");
        setMouvementTypeDetected('Entrée');
      } else {
        console.log("  -> Combinaison non gérée, type conservé:", mouvementTypeDetected);
      }
    } else if (formData.provenance && !formData.destination) {
      // Ne pas changer le type si seulement un des champs est rempli
      console.log("  -> Un seul champ rempli, attente du second champ");
    } else if (!formData.provenance && formData.destination) {
      // Ne pas changer le type si seulement un des champs est rempli
      console.log("  -> Un seul champ rempli, attente du second champ");
    } else {
      console.log("  -> Réinitialisation car les deux champs sont vides");
      setMouvementTypeDetected(null);
    }
  }, 500); // Délai de 500ms pour éviter les re-rendus pendant la saisie

  return () => clearTimeout(timer);
}, [formData.provenance, formData.destination, locations]);

    // Fonctions pour vérifier si un lieu est une chambre ou un établissement
    const isExistingRoom = (value) => {
        return value && locations.rooms && locations.rooms.some(room => 
            room.toLowerCase() === value.toLowerCase()
        );
    };

    const isExistingFacility = (value) => {
        return value && locations.facilities && locations.facilities.some(facility => 
            facility.toLowerCase() === value.toLowerCase()
        );
    };

    // Mettre à jour le type de mouvement automatiquement 
    useEffect(() => {
        if (mouvementTypeDetected) {
            setFormData(prevData => ({
                ...prevData,
                type: mouvementTypeDetected
            }));
        } else {
            setFormData(prevData => ({
                ...prevData,
                type: ''
            }));
        }
    }, [mouvementTypeDetected]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleDirectInputChange = (name, value) => {
        setFormData(prevData => {
            const newData = {
                ...prevData,
                [name]: value
            };
            return newData;
        });
    };

    // Fonction pour mettre à jour les locations après création d'un nouvel établissement
    const handleLocationsUpdate = (updatedLocations) => {
        setLocations(updatedLocations);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
    
        if (!mouvementTypeDetected) {
            setError('Type de mouvement non détecté. Vérifiez la provenance et la destination.');
            return;
        }
    
        // Vérifier si le formulaire est valide
        if (!isFormValid()) {
            setError('Veuillez corriger les erreurs dans le formulaire.');
            return;
        }
    
        // Afficher le modal de confirmation au lieu d'envoyer directement
        setShowConfirmModal(true);
    };

    const isFormValid = () => {
        // Vérifier d'abord si l'utilisateur a le droit de créer ce type de mouvement
        if (mouvementTypeDetected && !canCreateMovementType(mouvementTypeDetected)) {
            console.log("Permission refusée pour créer ce type de mouvement:", mouvementTypeDetected);
            return false;
        }
        
        // Valider les informations du résident
        if (!formData.nom || !formData.prenom || !formData.naissance || !formData.sex) {
            console.log("Informations du résident incomplètes");
            return false;
        }

        // Valider date et heure
        if (!formData.date || !formData.time) {
            console.log("Date ou heure invalide");
            return false;
        }

        // Valider la provenance/destination selon le type de mouvement
        if (!mouvementTypeDetected) {
            console.log("Type de mouvement non détecté");
            return false;
        }

        // Pour un transfert, on a besoin de provenance et destination
        if (mouvementTypeDetected === 'Transfert' && (!formData.provenance || !formData.destination)) {
            console.log("Provenance ou destination manquante pour transfert");
            return false;
        }

        // Pour une entrée, on a besoin d'une destination
        if (mouvementTypeDetected === 'Entrée' && !formData.destination) {
            console.log("Destination manquante pour entrée");
            return false;
        }

        // Pour une sortie, on a besoin d'une provenance
        if (mouvementTypeDetected === 'Sortie' && !formData.provenance) {
            console.log("Provenance manquante pour sortie");
            return false;
        }

        // Vérifier que la date de fin est définie si le type de durée est 'date'
        if ((mouvementTypeDetected === 'Entrée' || mouvementTypeDetected === 'Transfert') && 
            formData.dureeType === 'date' && !formData.dateFin) {
            console.log("Date de fin manquante");
            return false;
        }

        // Si toutes les vérifications sont passées, le formulaire est valide
        console.log("Formulaire valide");
        return true;
    };

    const confirmSubmit = async () => {
        setLoading(true);
        setShowConfirmModal(false);

        try {
            // Préparer la durée de séjour
            let sejour = formData.dureeType;
            if (formData.dureeType === 'date' && formData.dateFin) {
                sejour = `jusqu'au ${formData.dateFin}`;
            }

            // Traiter les données pour le format attendu par l'API
            const mouvementData = {
                ...formData,
                sejour,
                lieuDepart: formData.provenance,
                lieuArrivee: formData.destination,
                author: userData.username
            };

            const response = await addMouvement(mouvementData);

            if (response.status === 'success') {
                navigate('/mouvements');
            } else {
                setError(response.message || 'Erreur lors de l\'ajout du mouvement');
            }
        } catch (err) {
            setError('Une erreur est survenue lors de l\'ajout du mouvement');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Ajouter un mouvement</h2>
            
            {error && (
                <div className="p-4 mb-4 bg-red-100 text-red-700 rounded border border-red-300">
                    {error}
                </div>
            )}

            {/* Zone réservée pour le type de mouvement - toujours présente avec une hauteur fixe */}
            <div className="h-16 mb-4">
                {mouvementTypeDetected && (
                    <div className={`p-3 rounded-md font-bold text-xl text-center ${
                        mouvementTypeDetected === 'Entrée' 
                            ? 'bg-green-100 text-green-800' 
                            : mouvementTypeDetected === 'Sortie' 
                                ? 'bg-red-100 text-red-800' 
                                : 'bg-blue-100 text-blue-800'
                    }`}>
                        {mouvementTypeDetected}
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <FormPersonInfo 
                    formData={formData}
                    onChange={handleChange}
                />
                
                <FormOriginDestination
                    formData={formData}
                    onChange={handleDirectInputChange}
                    locations={locations}
                    loadingLocations={loadingLocations}
                    mouvementType={mouvementTypeDetected}
                    onLocationsUpdate={handleLocationsUpdate}
                />
                
                {(mouvementTypeDetected === 'Entrée' || mouvementTypeDetected === 'Transfert') && (
                    <FormDurationSelection
                        formData={formData}
                        onChange={handleChange}
                    />
                )}
                <p className="text-xs text-red-500">Tous les champs sont obligatoires</p>
                <div className="flex justify-end space-x-3 pt-4 border-t">
                    <button
                        type="button"
                        onClick={() => navigate('/mouvements')}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 ${
                            loading ? 'opacity-70 cursor-not-allowed' : ''
                        }`}
                    >
                        {loading ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                </div>
            </form>

            {showConfirmModal && (
                <ConfirmationModal
                    formData={formData}
                    mouvementType={mouvementTypeDetected}
                    onConfirm={confirmSubmit}
                    onCancel={() => setShowConfirmModal(false)}
                    isLoading={loading}
                />
            )}
        </div>
    );
}