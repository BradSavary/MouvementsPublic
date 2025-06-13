import React, { useState, useEffect, useRef } from 'react';
import { LoadingSpinner } from '../ui/LoadingSpinner';

export function AutoCompleteInput({ 
  label, 
  value, 
  onChange, 
  suggestions = [], 
  loading = false, 
  placeholder = "",
  required = false,
  type = "text",
  allowCreation = false,
  onCreateItem = null,   
  creationType = ""     
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [inputValue, setInputValue] = useState(value || '');
  const [isExactMatch, setIsExactMatch] = useState(true); // Indique si la valeur correspond exactement à une suggestion
  const [isCreated, setIsCreated] = useState(false); // Nouvel état pour suivre si un élément a été créé
  const inputRef = useRef(null);
  const suggestionRef = useRef(null);

  // Mettre à jour l'état local quand la prop value change
  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

   const normalizeString = (str) => {
    if (!str) return '';
    return str
      .toLowerCase()
      .normalize("NFD") // Décomposer les caractères accentués
      .replace(/[\u0300-\u036f]/g, ""); // Supprimer les accents
  };

  // Filtrer les suggestions quand la valeur change et vérifier s'il y a une correspondance exacte
  useEffect(() => {
    if (inputValue && inputValue.length >= 2 && suggestions.length > 0) {
      try {
        const normalizedInput = normalizeString(inputValue);
        
        // S'assurer que le filtrage fonctionne quel que soit le type des suggestions
        const filtered = suggestions.filter(suggestion => {
          // Si la suggestion est une chaîne de caractères
          if (typeof suggestion === 'string') {
            return normalizeString(suggestion).includes(normalizedInput);
          }
          // Si la suggestion est un objet avec une propriété 'name'
          else if (suggestion && typeof suggestion === 'object' && suggestion.name) {
            return normalizeString(suggestion.name).includes(normalizedInput);
          }
          return false; // Ignorer les autres types
        });
        
        setFilteredSuggestions(filtered);
        
        // Vérifier s'il y a une correspondance exacte (insensible aux accents et à la casse)
        const exactMatch = filtered.some(suggestion => {
          const suggestionText = typeof suggestion === 'string' ? suggestion : suggestion.name || '';
          return normalizeString(suggestionText) === normalizedInput;
        });
        
        // Si c'est un élément qu'on vient de créer, on le considère comme une correspondance exacte
        setIsExactMatch(exactMatch || isCreated);
      } catch (error) {
        console.error("Erreur lors du filtrage des suggestions:", error);
        setFilteredSuggestions([]);
        setIsExactMatch(false);
      }
    } else {
      setFilteredSuggestions([]);
      setIsExactMatch(inputValue.length === 0 || isCreated);
    }
  }, [inputValue, suggestions, isCreated]);

  // Fermer les suggestions lorsqu'on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionRef.current && 
        !suggestionRef.current.contains(event.target) &&
        inputRef.current && !inputRef.current.contains(event.target)
      ) {
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // Si l'utilisateur modifie la valeur, on réinitialise l'état isCreated
    if (isCreated && newValue !== value) {
      setIsCreated(false);
    }
    
    onChange(newValue); // Transmettre la valeur au parent
  };


  const handleSuggestionClick = (suggestion) => {
    // Gérer les suggestions qui peuvent être des objets ou des chaînes
    const valueToSet = typeof suggestion === 'string' ? suggestion : suggestion.name || '';
    setInputValue(valueToSet);
    onChange(valueToSet);
    setIsFocused(false);
    setIsCreated(false); // Ce n'est plus un élément créé mais une suggestion existante
  };

  const handleCreateNew = () => {
    if (onCreateItem && inputValue.trim() !== '') {
      // Indiquer qu'un nouvel élément est en cours de création
      onCreateItem(inputValue.trim(), (success) => {
        if (success) {
          setIsCreated(true); // Marquer que cet élément a été créé avec succès
          setIsExactMatch(true); // Considérer comme une correspondance exacte
        }
      });
      setIsFocused(false);
    }
  };

  // Fonction pour rendre le texte de la suggestion (chaîne ou objet)
  const renderSuggestionText = (suggestion) => {
    if (typeof suggestion === 'string') {
      return suggestion;
    } else if (suggestion && typeof suggestion === 'object' && suggestion.name) {
      return suggestion.name;
    }
    return '';
  };

  return (
    <div className="relative w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      )}
      <div className="relative">
        <input
          ref={inputRef}
          type={type}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsFocused(true)}
          placeholder={placeholder}
          required={required}
          className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 ${
            !isExactMatch && inputValue.length > 0 && allowCreation 
              ? 'border-yellow-300 focus:border-yellow-500' 
              : isCreated 
                ? 'border-green-300 focus:border-green-500'
                : 'border-gray-300 focus:border-blue-500'
          }`}
        />
        {loading && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <LoadingSpinner size="small" />
          </div>
        )}
        
        {/* Indicateur visuel pour un élément nouvellement créé */}
        {isCreated && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>
      
      {/* Message d'avertissement quand le lieu n'est pas dans la liste */}
      {!isExactMatch && inputValue.length > 0 && allowCreation && !isCreated && (
        <div className="text-xs text-yellow-700 mt-1 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{creationType} non trouvé, un nouvel {creationType.toLowerCase()} sera créé</span>
        </div>
      )}
      
      {/* Message de confirmation pour un élément nouvellement créé */}
      {isCreated && inputValue.length > 0 && (
        <div className="text-xs text-green-700 mt-1 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>Nouvel {creationType.toLowerCase()} créé avec succès</span>
        </div>
      )}
      
      {/* Liste des suggestions */}
      {isFocused && (
        <div 
          ref={suggestionRef}
          className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-auto"
        >
          {filteredSuggestions.length > 0 ? (
            <ul className="py-1">
              {filteredSuggestions.map((suggestion, index) => (
                <li 
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm"
                >
                  {renderSuggestionText(suggestion)}
                </li>
              ))}
            </ul>
          ) : inputValue.length >= 2 && allowCreation && !isCreated ? (
            <div className="py-2 px-4">
              <div className="text-sm text-gray-500 mb-2">
                Aucune correspondance trouvée
              </div>
              <button
                onClick={handleCreateNew}
                className="w-full text-left px-3 py-2 text-sm bg-green-50 text-green-700 hover:bg-green-100 rounded"
              >
                + Ajouter "{inputValue}" comme nouvel {creationType.toLowerCase()}
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}