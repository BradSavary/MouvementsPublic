import React, { useState, useEffect } from 'react';
import { AutoCompleteInput } from './AutoCompleteInput';
import { addLocation, getLocations } from '../../../data/location-data';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { SectionSelector } from '../Mouvement/Form/SectionSelector'; 

export function FormOriginDestination({ formData, onChange, locations, loadingLocations, mouvementType, onLocationsUpdate }) {
    const [creatingLocation, setCreatingLocation] = useState(false);
    const [creationError, setCreationError] = useState('');
    const locationSuggestions = locations && locations.all ? locations.all : [];
    
    // États séparés pour les services de départ et d'arrivée
    const [departureService, setDepartureService] = useState('');
    const [destinationService, setDestinationService] = useState('');

    // État pour suivre les opérations manuelles
    const [isProvenanceChanging, setIsProvenanceChanging] = useState(false);
    const [isDestinationChanging, setIsDestinationChanging] = useState(false);

    const [inputStabilityTimer, setInputStabilityTimer] = useState(null);

    
    //Fonction pour stabiliser l'interface pendant la saisie
    const stabilizeInputs = () => {
        if (inputStabilityTimer) clearTimeout(inputStabilityTimer);
        
        const timer = setTimeout(() => {
        }, 800);
        
        setInputStabilityTimer(timer);
    };

    // Fonction pour déterminer si une valeur est une chambre existante
    const isExistingRoom = (value) => {
      if (!locationSuggestions.length || !value) return false;
      const room = locationSuggestions.find(loc => loc.type === 'room' && loc.name === value);
      console.log(`isExistingRoom("${value}"):`, !!room);
      return !!room;
    };

    // Fonction pour vérifier si une valeur est un établissement existant
    const isExistingFacility = (value) => {
      if (!locationSuggestions.length || !value) return false;
      const facility = locationSuggestions.find(loc => loc.type === 'facility' && loc.name === value);
      console.log(`isExistingFacility("${value}"):`, !!facility);
      return !!facility;
    };

    const getRoomInfo = (roomName) => {
        console.log(`getRoomInfo("${roomName}")`);
        if (!roomName || !locations.all) {
            return { service: null, section: null };
        }
        
        const roomInfo = locations.all.find(location => 
            location.name === roomName && location.type === 'room'
        );
        
        if (!roomInfo) {
            return { service: null, section: null };
        }
        
        
        return {
            service: roomInfo.service || null,
            section: roomInfo.section || null
        };
    };

    // Fonctions pour obtenir les informations de service/section
    const getRoomService = (roomName) => {
        return getRoomInfo(roomName).service;
    };

    const getRoomSection = (roomName) => {
        return getRoomInfo(roomName).section;
    };

    // Mise à jour des services uniquement lorsque les chambres changent réellement
    useEffect(() => {
        if (formData.provenance && isExistingRoom(formData.provenance)) {
            const service = getRoomService(formData.provenance);
            setDepartureService(service);
        } else if (!formData.provenance) {
            setDepartureService('');
        }
    }, [formData.provenance, locations.all]);

    useEffect(() => {
        if (formData.destination && isExistingRoom(formData.destination)) {
            const service = getRoomService(formData.destination);
            setDestinationService(service);
        } else if (!formData.destination) {
            setDestinationService('');
        }
    }, [formData.destination, locations.all]);

    const handleProvenanceChange = (value) => {
        setIsProvenanceChanging(true);
        stabilizeInputs();
        
        try {
            // Mettre à jour uniquement la valeur de provenance
            onChange('provenance', value);
            
            // Si c'est une chambre existante
            if (isExistingRoom(value)) {
                const service = getRoomService(value);
                const section = getRoomSection(value);
                
                // Mise à jour contrôlée des propriétés associées
                onChange('chambreDepart', value);
                onChange('lieuDepart', '');
                onChange('serviceDepart', service);
                onChange('sectionDepart', section);
                
            } 
            // Si c'est un établissement externe
            else if (isExistingFacility(value) || value) {
                
                // Vider les propriétés de chambre
                onChange('chambreDepart', '');
                onChange('lieuDepart', value);
                onChange('serviceDepart', '');
                onChange('sectionDepart', '');
                
            }
            // Si le champ est vide, vider toutes les propriétés
            else {
                onChange('chambreDepart', '');
                onChange('lieuDepart', '');
                onChange('serviceDepart', '');
                onChange('sectionDepart', '');
            }
        } finally {
            setIsProvenanceChanging(false);
        }
    };
    
    const handleDestinationChange = (value) => {
        setIsDestinationChanging(true);
        stabilizeInputs();
        
        try {
            // Mettre à jour uniquement la valeur de destination
            onChange('destination', value);
            
            // Si c'est une chambre existante
            if (isExistingRoom(value)) {
                const service = getRoomService(value);
                const section = getRoomSection(value);
                
                // Mise à jour contrôlée des propriétés associées
                onChange('chambreArrivee', value);
                onChange('lieuArrivee', '');
                onChange('serviceArrivee', service);
                onChange('sectionArrivee', section);
                
            } 
            // Si c'est un établissement externe
            else if (isExistingFacility(value) || value) {
                
                // Vider les propriétés de chambre
                onChange('chambreArrivee', '');
                onChange('lieuArrivee', value);
                onChange('serviceArrivee', '');
                onChange('sectionArrivee', '');
                
            }
            // Si le champ est vide, vider toutes les propriétés
            else {
                onChange('chambreArrivee', '');
                onChange('lieuArrivee', '');
                onChange('serviceArrivee', '');
                onChange('sectionArrivee', '');
            }
        } finally {
            setIsDestinationChanging(false);
        }
    };

    const handleSectionDepartChange = (section) => {
        onChange('sectionDepart', section);
    };
    
    const handleSectionArriveeChange = (section) => {
        onChange('sectionArrivee', section);
    };

    // Fonction pour créer un nouvel établissement
    const handleCreateFacility = async (name, callback) => {
        try {
            setCreatingLocation(true);
            setCreationError('');
            
            const response = await addLocation({
                name,
                type: 'facility',
                service: null,
                section: null
            });
            
            
            if (response.status === 'success') {
                // Récupérer la liste mise à jour des emplacements
                const locationsResponse = await getLocations();
                if (locationsResponse.status === 'success' && onLocationsUpdate) {
                    onLocationsUpdate(locationsResponse.data);
                }
                
                if (callback) callback(true);
            } else {
                setCreationError(response.message || 'Échec de la création de l\'établissement');
                if (callback) callback(false);
            }
        } catch (error) {
            setCreationError('Une erreur est survenue lors de la création de l\'établissement');
            if (callback) callback(false);
        } finally {
            setCreatingLocation(false);
        }
    };

const renderRoomInfo = (roomName) => {
    if (!roomName || !isExistingRoom(roomName) || !locations.all) {
        return null;
    }
    
    // Trouver les informations de la chambre sélectionnée
    const roomInfo = locations.all.find(location => location.name === roomName && location.type === 'room');
    
    if (!roomInfo) {
        return null;
    }
    
    // Construire l'affichage de la précision en incluant service et section si disponibles
    let displayInfo = '';
    
    if (roomInfo.service && roomInfo.section) {
        // Les deux sont disponibles
        displayInfo = `${roomInfo.service} - ${roomInfo.section}`;
    } else if (roomInfo.section) {
        // Seulement la section est disponible
        displayInfo = roomInfo.section;
    } else if (roomInfo.service) {
        // Seulement le service est disponible
        displayInfo = roomInfo.service;
    } else {
        // Aucune info disponible
        displayInfo = 'Non spécifié';
    }
    
    
    return (
        <div className="mt-1 text-sm text-gray-600">
            <span className="font-medium">Précision:</span> {displayInfo}
        </div>
    );
};
    
    useEffect(() => {
    return () => {
        if (inputStabilityTimer) clearTimeout(inputStabilityTimer);
    };
}, [inputStabilityTimer]);
    
    
    return (
        <div className="bg-gray-50 p-4 rounded-lg">
            
            {creationError && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded border border-red-300">
                    {creationError}
                </div>
            )}
            
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Provenance et destination</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date du mouvement</label>
                    <input
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={(e) => onChange('date', e.target.value)}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Heure</label>
                    <input
                        type="time"
                        name="time"
                        value={formData.time}
                        onChange={(e) => onChange('time', e.target.value)}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Toujours afficher la provenance pendant la saisie ou si mouvementType n'est pas "Entrée" */}
                {(isProvenanceChanging || isDestinationChanging || inputStabilityTimer || mouvementType !== "Entrée") && (
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Provenance</label>
                        <AutoCompleteInput
                            value={formData.provenance}
                            onChange={(value) => handleProvenanceChange(value)}
                            suggestions={locationSuggestions}
                            loading={loadingLocations}
                            placeholder="Sélectionner ou saisir un établissement"
                            allowCreation={true}
                            onCreateItem={(name, callback) => handleCreateFacility(name, callback)}
                            creationType="établissement"
                        />
                        {formData.provenance && isExistingRoom(formData.provenance) && renderRoomInfo(formData.provenance)}
                        
                        {/* Section pour le service Médecine */}
                        {formData.provenance && 
                         isExistingRoom(formData.provenance) && 
                         departureService === "Médecine" && (
                            <div className="mt-2">
                                <SectionSelector 
                                    service={departureService}
                                    onSectionChange={handleSectionDepartChange}
                                    selectedSection={formData.sectionDepart}
                                />
                            </div>
                        )}
                    </div>
                )}
            
                {/* Toujours afficher la destination pendant la saisie ou si mouvementType n'est pas "Sortie" */}
                {(isProvenanceChanging || isDestinationChanging || inputStabilityTimer || mouvementType !== "Sortie") && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
                        <AutoCompleteInput
                            value={formData.destination}
                            onChange={(value) => handleDestinationChange(value)}
                            suggestions={locationSuggestions}
                            loading={loadingLocations}
                            placeholder="Sélectionner ou saisir un établissement"
                            allowCreation={true}
                            onCreateItem={(name, callback) => handleCreateFacility(name, callback)}
                            creationType="établissement"
                        />
                        {formData.destination && isExistingRoom(formData.destination) && renderRoomInfo(formData.destination)}
                        
                        {/* Section pour le service Médecine */}
                        {formData.destination && 
                         isExistingRoom(formData.destination) && 
                         destinationService === "Médecine" && (
                            <div className="mt-2">
                                <SectionSelector 
                                    service={destinationService}
                                    onSectionChange={handleSectionArriveeChange}
                                    selectedSection={formData.sectionArrivee}
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>
            
            <div className="mt-3 text-xs text-gray-500">
                <p>Note: Seuls les établissements externes peuvent être créés dynamiquement. Les chambres doivent être ajoutées par un administrateur.</p>
            </div>

        </div>
    );
}