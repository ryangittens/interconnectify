const MainRoutes = {
  path: '/main',
  meta: {
    requiresAuth: true
  },
  redirect: '/main/dashboard/default',
  component: () => import('@/layouts/default/DefaultLayout.vue'),
  children: [
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
      name: 'ProjectView',
      path: '/project/:id/:table',
      component: () => import('@/views/project/ProjectView.vue')
    },
    {
      name: 'Interconnection',
      path: '/tools/interconnection',
      component: () => import('@/views/interconnection/InterconnectionTool.vue')
    }
  ]
};

export default MainRoutes;
