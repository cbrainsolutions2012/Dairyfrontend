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
  // {
  //   exact: 'true',
  //   path: '/auth/signup-1',
  //   element: lazy(() => import('./views/auth/signup/SignUp1'))
  // },
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
      // {
      //   exact: 'true',
      //   path: '/basic/button',
      //   element: lazy(() => import('./views/ui-elements/BasicButton'))
      // },
      {
        exact: 'true',
        path: '/empmaster',
        element: lazy(() => import('./views/Employee Master/Register/Emp'))
      },
      {
        exact: 'true',
        path: '/editemp/:id',
        element: lazy(() => import('./views/Employee Master/Register/EditEmp'))
      },
      {
        exact: 'true',
        path: '/devotee',
        element: lazy(() => import('./views/Employee Master/devotee/Devotee'))
      },
      {
        exact: 'true',
        path: '/editdevotee/:id',
        element: lazy(() => import('./views/Employee Master/devotee/editDevotee'))
      },

      {
        exact: 'true',
        path: '/gosevareceipt',
        element: lazy(() => import('./views/GoSevaReceipt/GoSevaReceipt'))
      },
      {
        exact: 'true',
        path: '/editgosevareceipt/:id',
        element: lazy(() => import('./views//GoSevaReceipt/EditGoSevaReceipt'))
      },
      {
        exact: 'true',
        path: '/dengipawti',
        element: lazy(() => import('./views/Employee Master/DengiPawati/DengiPawati'))
      },
      {
        exact: 'true',
        path: '/whatsappinstance',
        element: lazy(() => import('./views/WhatsappInstance/WhatsappInstance'))
      },
      {
        exact: 'true',
        path: '/pooja',
        element: lazy(() => import('./views/Employee Master/pooja/Pooja'))
      },
      {
        exact: 'true',
        path: '/editseva/:id',
        element: lazy(() => import('./views/Employee Master/pooja/editSeva'))
      },
      {
        exact: 'true',
        path: '/gotra',
        element: lazy(() => import('./views/Employee Master/gotra/Gotra'))
      },
      {
        exact: 'true',
        path: '/editgotra/:id',
        element: lazy(() => import('./views/Employee Master/gotra/editGotra'))
      },
      {
        exact: 'true',
        path: '/donation',
        element: lazy(() => import('./views/Employee Master/donation/Donation'))
      },
      {
        exact: 'true',
        path: '/templereg',
        element: lazy(() => import('./views/Employee Master/temple profile/TempleProfile'))
      },
      {
        exact: 'true',
        path: '/edittemple/:id',
        element: lazy(() => import('./views/Employee Master/temple profile/EditTemple'))
      },
      {
        exact: 'true',
        path: '/donar',
        element: lazy(() => import('./views/Employee Master/donar/Donar'))
      },
      {
        exact: 'true',
        path: '/countermaster',
        element: lazy(() => import('./views/Employee Master/counter master/ConterMaster'))
      },
      {
        exact: 'true',
        path: '/countertype',
        element: lazy(() => import('./views/Employee Master/CounterType/CounterType'))
      },
      {
        exact: 'true',
        path: '/cashbook',
        element: lazy(() => import('./views/Employee Master/cashbook/Cashbook'))
      },
      {
        exact: 'true',
        path: '/income',
        element: lazy(() => import('./views/Employee Master/income form/IncomeForm'))
      },
      {
        exact: 'true',
        path: '/expenses',
        element: lazy(() => import('./views/Employee Master/expenses form/ExpenseForm'))
      },
      // {
      //   exact: 'true',
      //   path: '/reports/totalemp',
      //   element: lazy(() => import('./views/Reports/Total Employee/TotalEmployee'))
      // },
      // {
      //   exact: 'true',
      //   path: '/reports/totaldonar',
      //   element: lazy(() => import('./views/Reports/Total Donar/TotalDonar'))
      // },
      {
        exact: 'true',
        path: '/reports/totaldevotee',
        element: lazy(() => import('./views/Reports/Total Devotee/TotalDevotee'))
      },
      {
        exact: 'true',
        path: '/reports/totaldevoteepawti',
        element: lazy(() => import('./views/Reports/DevoteePawati/DevoteePawti'))
      },
      {
        exact: 'true',
        path: '/reports/totalgosevareceiptpawti',
        element: lazy(() => import('./views/Reports/GoSevaReceipt/GoSevaReceipt'))
      },
      // {
      //   exact: 'true',
      //   path: '/reports/dailytran',
      //   element: lazy(() => import('./views/Reports/Daily Transaction/DailyTransaction'))
      // },
      {
        exact: 'true',
        path: '/reports/cashbook',
        element: lazy(() => import('./views/Reports/Cashbook/Cashbook'))
      },
      {
        exact: 'true',
        path: '/reports/income',
        element: lazy(() => import('./views/Reports/Income/Income'))
      },
      {
        exact: 'true',
        path: '/reports/expenses',
        element: lazy(() => import('./views/Reports/Expenses/Expenses'))
      },
      // {
      //   exact: 'true',
      //   path: '/basic/breadcrumb-pagination',
      //   element: lazy(() => import('./views/ui-elements/BasicBreadcrumbPagination'))
      // },
      // {
      //   exact: 'true',
      //   path: '/basic/collapse',
      //   element: lazy(() => import('./views/ui-elements/BasicCollapse'))
      // },

      // {
      //   exact: 'true',
      //   path: '/basic/typography',
      //   element: lazy(() => import('./views/ui-elements/BasicTypography'))
      // },
      // {
      //   exact: 'true',
      //   path: '/basic/tooltip-popovers',
      //   element: lazy(() => import('./views/ui-elements/BasicTooltipsPopovers'))
      // },
      // {
      //   exact: 'true',
      //   path: '/sample-page',
      //   element: lazy(() => import('./views/extra/SamplePage'))
      // },
      {
        path: '*',
        exact: 'true',
        element: () => <Navigate to={BASE_URL} />
      }
    ]
  }
];

export default renderRoutes;
