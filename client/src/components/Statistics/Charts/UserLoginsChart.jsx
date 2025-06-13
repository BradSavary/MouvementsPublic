import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { ChartWrapper } from './ChartWrapper';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export function UserLoginsChart({ data, isLoading }) {
  // Préparer les données pour le graphique
  const chartData = {
    labels: [],
    datasets: [
      {
        label: 'Connexions réussies',
        data: [],
        backgroundColor: 'rgba(75, 192, 192, 0.7)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
      {
        label: 'Connexions échouées',
        data: [],
        backgroundColor: 'rgba(255, 99, 132, 0.7)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
      }
    ],
  };

  if (data && data.length > 0) {
    // Trier par nombre total de connexions décroissant
    const sortedData = [...data].sort((a, b) => b.total - a.total);
    
    // Prendre les 10 premiers utilisateurs
    const topUsers = sortedData.slice(0, 10);
    
    topUsers.forEach(item => {
      chartData.labels.push(item.username);
      chartData.datasets[0].data.push(parseInt(item.successful));
      chartData.datasets[1].data.push(parseInt(item.failed));
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
      x: {
        stacked: false,
      },
      y: {
        stacked: false,
        beginAtZero: true,
        ticks: {
          precision: 0
        }
      }
    }
  };

  return (
    <ChartWrapper title="Connexions par utilisateur (Top 10)" isLoading={isLoading}>
      <div style={{ height: '400px' }}>
        <Bar data={chartData} options={options} />
      </div>
    </ChartWrapper>
  );
}