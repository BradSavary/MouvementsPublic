import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { ChartWrapper } from './ChartWrapper';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export function DeathsMonthlyChart({ data, isLoading }) {
  // Fonction pour formater un mois (YYYY-MM) en nom du mois localisé
  const formatMonth = (monthStr) => {
    if (!monthStr) return '';
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  };

  // Préparer les données pour le graphique
  const chartData = {
    labels: [],
    datasets: [
      {
        label: 'Nombre de décès',
        data: [],
        backgroundColor: 'rgba(128, 128, 128, 0.7)',
        borderColor: 'rgba(128, 128, 128, 1)',
        borderWidth: 1,
      },
    ],
  };

  if (data && data.byMonth && data.byMonth.length > 0) {
    data.byMonth.forEach(item => {
      chartData.labels.push(formatMonth(item.month));
      chartData.datasets[0].data.push(item.count);
    });
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `Décès: ${context.raw}`;
          }
        }
      }
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

  return (
    <ChartWrapper title={`Décès mensuels (Total: ${data?.total || 0})`} isLoading={isLoading}>
      <div style={{ height: '300px' }}>
        <Bar data={chartData} options={options} />
      </div>
    </ChartWrapper>
  );
}