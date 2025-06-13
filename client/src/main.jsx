import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import { Root } from './routes/root';
import { Login } from './routes/login';
import { Logout } from './routes/logout';
import { Home } from './routes/home';
import { ProtectedRoute } from './components/Protection/ProtectedRoute';
import { MouvementListPage } from './routes/mouvementList';
import { MouvementFormPage } from './routes/mouvementForm';
import {DecesListPage} from './routes/decesList';
import {DecesFormPage} from './routes/decesForm';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import { UnifiedHistoryPage } from './routes/unifiedHistory';
import { PreferencesPage } from "./routes/preferences";
import { StatisticsPage} from './routes/statistics'


import { PermissionProtectedRoute } from './components/Protection/PermissionProtectedRoute';


import './index.css'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Login />,
  },
  {
    path: '/logout',
    element: <Logout />,
  },
  
  {
    path: '/',
    element: <ProtectedRoute><Root /></ProtectedRoute>,
    children: [
      {
        path: 'home',
        element: <Home />,
      },
      {
        path: 'mouvements',
        element: <PermissionProtectedRoute requiredPermission="viewHistory">
          <MouvementListPage />
        </PermissionProtectedRoute>,
      },
      {
        path: 'mouvements/ajout',
        element: <PermissionProtectedRoute requiredPermission="createMovement">
          <MouvementFormPage />
        </PermissionProtectedRoute>,
      },
      {
        path: 'deces',
        element: <PermissionProtectedRoute requiredPermission="viewDeathRecords">
          <DecesListPage />
        </PermissionProtectedRoute>,
      },
      {
        path: 'deces/ajout',
        element: <PermissionProtectedRoute requiredPermission="createDeathRecord">
          <DecesFormPage />
        </PermissionProtectedRoute>,
      },
      {
        path: 'admin',
        element: <PermissionProtectedRoute requiredPermission="adminAccess">
          <AdminDashboard />
        </PermissionProtectedRoute>,
      },
      {
        path: 'historique',
        element: <PermissionProtectedRoute requiredPermission="viewUnifiedHistory">
          <UnifiedHistoryPage />
        </PermissionProtectedRoute>,
      },
      {
        path: "preferences",
        element: <PreferencesPage />,
      },
      {
        path: "statistics",
        element:<PermissionProtectedRoute requiredPermission="viewStatistics">
      <StatisticsPage />
    </PermissionProtectedRoute>,
      }
    ]
  }
]);

const rootElement = document.querySelector('#root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <div className='h-screen bg-custom'>
      <React.StrictMode>
          <RouterProvider router={router} />
      </React.StrictMode>
    </div>,
  );
} else {
  console.error('No root element found');
}