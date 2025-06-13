import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { ChartWrapper } from './ChartWrapper';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export function LoginsChart({ data, isLoading }) {
  // Fonction pour formater une date (YYYY-MM-DD)
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  // Préparer les données pour le graphique
  const chartData = {
    labels: [],
    datasets: [
      {
        label: 'Connexions réussies',
        data: [],
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
        tension: 0.1
      },
      {
        label: 'Connexions échouées',
        data: [],
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
        tension: 0.1
      }
    ],
  };

  if (data && data.byDay && data.byDay.length > 0) {
    data.byDay.forEach(item => {
      chartData.labels.push(formatDate(item.date));
      chartData.datasets[0].data.push(item.successful);
      chartData.datasets[1].data.push(item.failed);
    });
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0
        }
      }
    }
  };

  // Calculer les totaux pour l'affichage
  const totals = data?.totals || { total: 0, successful: 0, failed: 0 };
  const successful = parseInt(totals.successful) || 0;
  const failed = parseInt(totals.failed) || 0;
  const total = parseInt(totals.total) || 0;

  return (
    <ChartWrapper title={`Historique des connexions (Total: ${total}, Réussies: ${successful}, Échouées: ${failed})`} isLoading={isLoading}>
      <div style={{ height: '300px' }}>
        <Line data={chartData} options={options} />
      </div>
    </ChartWrapper>
  );
}