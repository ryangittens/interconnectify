const MainRoutes = {
  path: '/main',
  meta: {
    requiresAuth: false
  },
  component: () => import('@/layouts/default/DefaultLayout.vue'),
  children: [
    {
      name: 'Load Calculation',
      path: '/tools/loadCalculation',
      component: () => import('@/views/loadCalculation/LoadCalculation.vue')
    }
  ]
};

export default MainRoutes;
