import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { ChartWrapper } from './ChartWrapper';

ChartJS.register(ArcElement, Tooltip, Legend);

export function MovementTypeChart({ data, isLoading }) {
  // Couleurs pour chaque type de mouvement
  const typeColors = {
    'Entrée': 'rgba(75, 192, 192, 0.7)',
    'Sortie': 'rgba(255, 99, 132, 0.7)',
    'Transfert': 'rgba(54, 162, 235, 0.7)',
    'Décès': 'rgba(128, 128, 128, 0.7)',
  };

  // Préparer les données pour le graphique
  const chartData = {
    labels: [],
    datasets: [
      {
        label: 'Mouvements par type',
        data: [],
        backgroundColor: [],
        borderColor: [],
        borderWidth: 1,
      },
    ],
  };

  if (data && data.length > 0) {
    data.forEach(item => {
      chartData.labels.push(item.type);
      chartData.datasets[0].data.push(item.count);
      
      const color = typeColors[item.type] || 'rgba(201, 203, 207, 0.7)';
      chartData.datasets[0].backgroundColor.push(color);
      chartData.datasets[0].borderColor.push(color.replace('0.7', '1'));
    });
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
  };

  return (
    <ChartWrapper title="Répartition des mouvements par type" isLoading={isLoading}>
      <div style={{ height: '300px' }}>
        <Pie data={chartData} options={options} />
      </div>
    </ChartWrapper>
  );
}