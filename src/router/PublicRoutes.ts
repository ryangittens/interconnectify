const MainRoutes = {
  path: '/main',
  meta: {
    requiresAuth: false
  },
  redirect: '/main/dashboard/default',
  component: () => import('@/layouts/default/DefaultLayout.vue'),
  children: [
    {
      name: 'LandingPage',
      path: '/',
      component: () => import('@/views/dashboards/default/DefaultDashboard.vue')
    },
    {
      name: 'Load Calculation',
      path: '/tools/loadCalculation',
      component: () => import('@/views/loadCalculation/LoadCalculation.vue')
    }
  ]
};

export default MainRoutes;
