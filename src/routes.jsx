import React, { Suspense, Fragment, lazy } from 'react';
import { Routes, Navigate, Route } from 'react-router-dom';
import AuthGaurd from 'views/auth/protected-routing/AuthGaurd';

// project import
import Loader from './components/Loader/Loader';
import AdminLayout from './layouts/AdminLayout';

import { BASE_URL } from './config/constant';

// ==============================|| ROUTES ||============================== //

const renderRoutes = (routes = []) => (
  <Suspense fallback={<Loader />}>
    <Routes>
      {routes.map((route, i) => {
        const Guard = route.guard || Fragment;
        const Layout = route.layout || Fragment;
        const Element = route.element;

        return (
          <Route
            key={i}
            path={route.path}
            exact={route.exact}
            element={
              <Guard>
                <Layout>{route.routes ? renderRoutes(route.routes) : <Element props={true} />}</Layout>
              </Guard>
            }
          />
        );
      })}
    </Routes>
  </Suspense>
);

export const routes = [
  // Authentication routes
  {
    exact: 'true',
    path: '/',
    element: lazy(() => import('./views/auth/signin/SignIn1'))
  },
  {
    exact: 'true',
    path: '/reset-password',
    element: lazy(() => import('./views/auth/reset-password/ResetPassword1'))
  },
  {
    path: '*',
    layout: AdminLayout,
    guard: AuthGaurd,
    routes: [
      {
        exact: 'true',
        path: '/dashboard',
        element: lazy(() => import('./views/dashboard'))
      },
      {
        exact: 'true',
        path: '/*',
        element: () => <Navigate to="/dashboard" replace />
      },
      {
        exact: 'true',
        path: '/buyers',
        element: lazy(() => import('./views/Buyers/Buyers'))
      },
      {
        exact: 'true',
        path: '/buyers-payment',
        element: lazy(() => import('./views/Buyers Payment/BuyersPayment'))
      },
      {
        exact: 'true',
        path: '/income',
        element: lazy(() => import('./views/Income/Income'))
      },
      {
        exact: 'true',
        path: '/expenses',
        element: lazy(() => import('./views/Expenses/Expenses'))
      },
      {
        exact: 'true',
        path: '/milkstore',
        element: lazy(() => import('./views/Milk Store/MilkStore'))
      },

      {
        exact: 'true',
        path: '/milkdistribution',
        element: lazy(() => import('./views/Milk Distribution/MilkDistribution'))
      },
      {
        exact: 'true',
        path: '/sellers',
        element: lazy(() => import('./views/Sellers/Sellers'))
      },
      {
        exact: 'true',
        path: '/sellers-payment',
        element: lazy(() => import('./views/Sellers Payment/SellersPayment'))
      },
      {
        path: '*',
        exact: 'true',
        element: () => <Navigate to={BASE_URL} />
      }
    ]
  }
];

export default renderRoutes;
