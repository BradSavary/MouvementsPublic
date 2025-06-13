import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { addDeces } from '../../../../data/deces-data';
import { getLocations } from '../../../../data/location-data';
import { usePermissions } from '../../../../lib/usePermissions';
import { ConfirmationDecesModal } from './ConfirmationDecesModal';
import { SectionSelector } from '../../Mouvement/Form/SectionSelector';
import { AutoCompleteInput } from '../../Form/AutoCompleteInput';
import { FormPersonInfo } from '../../Form/FormPersonInfo';

export function DecesForm() {
    const { userData } = useOutletContext();
    const navigate = useNavigate();
    const { can } = usePermissions(userData);
    
    // État du formulaire
    const [formData, setFormData] = useState({
        nom: '',
        nom_naissance: '',
        prenom: '',
        naissance: '',
        sex: 'Homme',
        date_deces: new Date().toISOString().split('T')[0],
        heure_deces: new Date().toTimeString().substring(0, 5),
        chambre: '',
        section: ''
    });

    // États pour l'interface
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    
    // État pour les emplacements (chambres)
    const [locations, setLocations] = useState({ rooms: [], facilities: [], all: [] });
    const [loadingLocations, setLoadingLocations] = useState(false);
    
    // État pour stocker le service et la section de la chambre sélectionnée
    const [roomService, setRoomService] = useState('');
    const [roomSection, setRoomSection] = useState('');

    // Charger les emplacements au chargement du composant
    useEffect(() => {
        const fetchLocations = async () => {
            setLoadingLocations(true);
            try {
                const response = await getLocations();
                if (response.status === 'success') {
                    setLocations(response.data);
                } else {
                    console.error("Erreur lors du chargement des emplacements:", response.message);
                }
            } catch (err) {
                console.error('Erreur lors du chargement des emplacements:', err);
            } finally {
                setLoadingLocations(false);
            }
        };
        
        fetchLocations();
    }, []);

    // Obtenir le service et la section associés à une chambre
    const getRoomInfo = (roomName) => {
        if (!roomName || !locations.all || !Array.isArray(locations.all)) {
            return { service: '', section: '' };
        }
        
        const room = locations.all.find(loc => loc.name === roomName && loc.type === 'room');
        return room 
            ? { service: room.service || '', section: room.section || '' } 
            : { service: '', section: '' };
    };
    
    // Mettre à jour le service et la section lorsque la chambre change
    useEffect(() => {
        if (formData.chambre) {
            const { service, section } = getRoomInfo(formData.chambre);
            console.log(`Chambre ${formData.chambre} sélectionnée, service: ${service}, section: ${section}`);
            setRoomService(service);
            setRoomSection(section);
            
            // Si la chambre a une section prédéfinie, l'utiliser
            if (section) {
                setFormData(prev => ({
                    ...prev,
                    section: section
                }));
            } else if (service !== 'Médecine') {
                // Pour les autres services sans section prédéfinie, réinitialiser
                setFormData(prev => ({
                    ...prev,
                    section: ''
                }));
            }
        } else {
            setRoomService('');
            setRoomSection('');
            setFormData(prev => ({
                ...prev,
                section: ''
            }));
        }
    }, [formData.chambre, locations.all]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleDirectInputChange = (name, value) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!isFormValid()) {
            setError('Veuillez remplir tous les champs obligatoires.');
            return;
        }
        
        setShowConfirmModal(true);
    };

    const isFormValid = () => {
        const requiredFields = ['nom', 'prenom', 'naissance', 'sex', 'date_deces', 'heure_deces', 'chambre'];
        for (const field of requiredFields) {
            if (!formData[field]) return false;
        }
        
        // Si la chambre est du service Médecine et qu'aucune section n'est sélectionnée
        if (roomService === 'Médecine' && !formData.section) {
            return false;
        }

        if(formData.nom.trim() !== '' ||
            formData.nom_naissance.trim() !== '' ||
            formData.prenom.trim() !== '' ||
            formData.naissance.trim() !== '' ||
            formData.sex.trim() !== '' ||
            formData.date_deces.trim() !== '' ||
            formData.heure_deces.trim() !== '' ||
            formData.chambre.trim() !== ''){
            return true;
        }

        return false;
    };

    const confirmSubmit = async () => {
        setLoading(true);
        setError('');
        
        try {
            const submitData = {
                ...formData,
                author: userData.username
            };
            
            const response = await addDeces(submitData);
            
            if (response.status === 'success') {
                navigate('/deces');
            } else {
                setError(response.message || 'Une erreur est survenue lors de l\'enregistrement du décès');
                setShowConfirmModal(false);
            }
        } catch (err) {
            console.error('Erreur lors de l\'enregistrement du décès:', err);
            setError('Une erreur est survenue lors de l\'enregistrement du décès');
            setShowConfirmModal(false);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Enregistrer un décès</h2>
            
            {error && (
                <div className="p-4 mb-4 bg-red-100 text-red-700 rounded border border-red-300">
                    {error}
                </div>
            )}

             <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                    {/* Informations personnelles */}
                    <FormPersonInfo 
                        formData={formData} 
                        onChange={handleChange}
                    />
                    
                    {/* Informations sur le décès */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-lg font-medium mb-4">Informations sur le décès</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date du décès</label>
                                <input
                                    type="date"
                                    name="date_deces"
                                    value={formData.date_deces}
                                    onChange={handleChange}
                                    required
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Heure du décès</label>
                                <input
                                    type="time"
                                    name="heure_deces"
                                    value={formData.heure_deces}
                                    onChange={handleChange}
                                    required
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Chambre</label>
                                <AutoCompleteInput 
                                    value={formData.chambre}
                                    onChange={(value) => handleDirectInputChange('chambre', value)}
                                    suggestions={locations.all?.filter(loc => loc.type === 'room')?.map(loc => loc.name) || []}
                                    loading={loadingLocations}
                                    placeholder="Sélectionner une chambre"
                                    required={true}
                                />
                                {roomService && (
                                    <p className="text-sm text-gray-500 mt-1">
                                        Service: {roomService} {roomSection && `(${roomSection})`}
                                    </p>
                                )}
                            </div>
                            
                            {roomService === 'Médecine' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                                    <select
                                        name="section"
                                        value={formData.section}
                                        onChange={handleChange}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    >
                                        <option value="">Sélectionner une section</option>
                                        <option value="Médecine">Médecine</option>
                                        <option value="USLD">USLD</option>
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>
                    <p className="text-xs text-red-500">Tous les champs sont obligatoires</p>
                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={() => navigate('/deces')}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                        >
                            {loading ? 'Enregistrement...' : 'Enregistrer'}
                        </button>
                    </div>
                </div>
            </form>
            
            {showConfirmModal && (
                <ConfirmationDecesModal 
                    formData={formData}
                    onConfirm={confirmSubmit}
                    onCancel={() => setShowConfirmModal(false)}
                    isLoading={loading}
                />
            )}
        </div>
    );
}