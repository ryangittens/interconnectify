const MainRoutes = {
  path: '/main',
  meta: {
    requiresAuth: true
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
      name: 'Default',
      path: '/dashboard/default',
      component: () => import('@/views/dashboards/default/DefaultDashboard.vue')
    },
    {
      name: 'NewProject',
      path: '/project/new',
      component: () => import('@/views/project/NewProject.vue')
    },
    {
      name: 'NewBlock',
      path: '/block/new',
      component: () => import('@/views/project/NewBlock.vue')
    },
    {
      name: 'ProjectDesignView',
      path: '/project/:id/:table',
      component: () => import('@/views/project/ProjectDesignView.vue')
    },
    {
      name: 'Interconnection',
      path: '/tools/interconnection',
      component: () => import('@/views/interconnection/InterconnectionTool.vue')
    },
    {
      name: 'Battery Estimator',
      path: '/tools/batteryEstimator',
      component: () => import('@/views/batteryEstimator/BatteryEstimator.vue')
    },
    {
      name: 'SDL Projects',
      path: '/sdlProjects',
      component: () => import('@/views/dashboards/sdlProjects/SdlProjects.vue')
    }
  ]
};

export default MainRoutes;
