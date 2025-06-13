import React, { createContext, useContext, useState } from 'react';

const PrintContext = createContext();

export function PrintProvider({ children }) {
  const [printMode, setPrintMode] = useState(false);
  const [printData, setPrintData] = useState(null);
  const [printTitle, setPrintTitle] = useState('');
  const [printSettings, setPrintSettings] = useState({
    includeHeaders: true,
    orientation: 'portrait',
    pageSize: 'A4',
    showDateRange: true,
    itemsToPrint: 10, // Nombre d'éléments à imprimer par défaut
    dateFrom: '',
    dateTo: '',
  });
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [originalData, setOriginalData] = useState(null); // Pour garder les données complètes

  const preparePrint = (data, title, initialSettings = {}) => {
    setOriginalData(data); // Stocker les données originales complètes
    setPrintData(data);
    setPrintTitle(title);
    setPrintSettings(prev => ({
      ...prev,
      ...initialSettings,
      dateFrom: initialSettings.dateFrom || prev.dateFrom,
      dateTo: initialSettings.dateTo || prev.dateTo,
      itemsToPrint: initialSettings.itemsToPrint || 10, // Valeur par défaut
    }));
    setShowSettings(true);
  };

  const startPrintPreview = () => {
    // Limiter les données à imprimer selon le paramètre
    let dataToPrint;
    if (originalData && Array.isArray(originalData)) {
      dataToPrint = [...originalData].slice(0, printSettings.itemsToPrint);
    } else if (originalData && originalData.items && Array.isArray(originalData.items)) {
      dataToPrint = {
        ...originalData,
        items: [...originalData.items].slice(0, printSettings.itemsToPrint)
      };
    } else {
      dataToPrint = originalData;
    }
    
    setPrintData(dataToPrint);
    setShowPrintPreview(true);
    setShowSettings(false);
  };

  const executePrint = () => {
    setPrintMode(true);
    
    // Ajouter des styles spécifiques à l'orientation avant l'impression
    if (printSettings.orientation === 'landscape') {
      const style = document.createElement('style');
      style.id = 'print-orientation-style';
      style.innerHTML = '@page { size: landscape; }';
      document.head.appendChild(style);
    }
    
    setTimeout(() => {
      window.print();
      
      // Nettoyage après impression
      const styleElement = document.getElementById('print-orientation-style');
      if (styleElement) {
        styleElement.remove();
      }
      
      setPrintMode(false);
    }, 200);
  };

  const cancelPrint = () => {
    setShowPrintPreview(false);
    setShowSettings(false);
    setPrintData(null);
    setOriginalData(null);
  };

  return (
    <PrintContext.Provider
      value={{
        printMode,
        printData,
        originalData,
        printTitle,
        printSettings,
        setPrintSettings,
        preparePrint,
        executePrint,
        cancelPrint,
        showPrintPreview,
        startPrintPreview,
        showSettings
      }}
    >
      {children}
    </PrintContext.Provider>
  );
}

export const usePrint = () => useContext(PrintContext);