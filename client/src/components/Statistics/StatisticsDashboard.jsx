import React, { useState, useEffect } from 'react';
import { getStatisticsSummary } from '../../../data/statistics-data';
import { MovementTypeChart } from './Charts/MovementTypeChart';
import { DeathsMonthlyChart } from './Charts/DeathsMonthlyChart';
import { LoginsChart } from './Charts/LoginsChart';
import { UserLoginsChart } from './Charts/UserLoginsChart';
import { UnvalidatedCountCard } from './Charts/UnvalidatedCountChart';
import { UpcomingMovementsCard } from './Charts/UpcomingMovementsCard';
import { LoadingSpinner } from '../ui/LoadingSpinner';

export function StatisticsDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fromDate, setFromDate] = useState(() => {
    // Par défaut, date d'il y a un an
    const date = new Date();
    date.setFullYear(date.getFullYear() - 1);
    return date.toISOString().split('T')[0];
  });

  // Charger les statistiques au chargement ou changement de date
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError('');
        
        const response = await getStatisticsSummary(fromDate);
        
        if (response.status === 'success') {
          setStats(response.data);
        } else {
          setError(response.message || "Erreur lors du chargement des statistiques");
        }
      } catch (err) {
        console.error("Erreur lors du chargement des statistiques:", err);
        setError("Une erreur est survenue lors du chargement des statistiques");
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, [fromDate]);

  const handleDateChange = (e) => {
    setFromDate(e.target.value);
  };

  if (loading && !stats) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-2 text-gray-600">Chargement des statistiques...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
        <h3 className="font-bold mb-2">Erreur</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <h2 className="text-xl font-bold mb-2 sm:mb-0">Tableau de bord des statistiques</h2>
        
        <div className="flex items-center space-x-2">
          <label htmlFor="fromDate" className="text-sm font-medium text-gray-700">
            Afficher les données depuis
          </label>
          <input
            type="date"
            id="fromDate"
            value={fromDate}
            onChange={handleDateChange}
            className="border rounded-md shadow-sm p-1 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphique des mouvements par type */}
        <MovementTypeChart 
          data={stats?.movementsByType} 
          isLoading={loading} 
        />
        
        {/* Graphique des décès par mois */}
        <DeathsMonthlyChart 
          data={stats?.deathsCount} 
          isLoading={loading} 
        />

        {/* Graphique des connexions quotidiennes */}
        <LoginsChart 
          data={stats?.loginsCount} 
          isLoading={loading} 
        />
        
        {/* Graphique des connexions par utilisateur */}
        <UserLoginsChart 
          data={stats?.topUsers} 
          isLoading={loading} 
        />

        {/* Graphique des éléments non validés */}
        <UnvalidatedCountCard 
          data={stats?.unvalidatedCount} 
          isLoading={loading} 
        />

        {/* Carte des mouvements à venir */}
        <UpcomingMovementsCard 
          data={stats?.upcomingMovements} 
          isLoading={loading} 
        />
      </div>
    </div>
  );
}