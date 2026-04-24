import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/docs/',
    component: ComponentCreator('/docs/', '81a'),
    routes: [
      {
        path: '/docs/',
        component: ComponentCreator('/docs/', '66f'),
        routes: [
          {
            path: '/docs/',
            component: ComponentCreator('/docs/', 'e0e'),
            routes: [
              {
                path: '/docs/admin/allocations/',
                component: ComponentCreator('/docs/admin/allocations/', '134'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/admin/flow/',
                component: ComponentCreator('/docs/admin/flow/', '3c2'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/admin/overview/',
                component: ComponentCreator('/docs/admin/overview/', '0ae'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/admin/projects/',
                component: ComponentCreator('/docs/admin/projects/', '2b2'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/admin/review-loe/',
                component: ComponentCreator('/docs/admin/review-loe/', 'd6e'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/admin/users/',
                component: ComponentCreator('/docs/admin/users/', '663'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/developer/architecture/',
                component: ComponentCreator('/docs/developer/architecture/', '427'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/developer/backend/',
                component: ComponentCreator('/docs/developer/backend/', '319'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/developer/data-model/',
                component: ComponentCreator('/docs/developer/data-model/', '82b'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/developer/frontend/',
                component: ComponentCreator('/docs/developer/frontend/', 'f0a'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/developer/operations/',
                component: ComponentCreator('/docs/developer/operations/', '00a'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/developer/setup/',
                component: ComponentCreator('/docs/developer/setup/', '65f'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/user/daily-entry/',
                component: ComponentCreator('/docs/user/daily-entry/', 'd0d'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/user/dashboard/',
                component: ComponentCreator('/docs/user/dashboard/', '5f3'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/user/flow/',
                component: ComponentCreator('/docs/user/flow/', '29d'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/user/getting-started/',
                component: ComponentCreator('/docs/user/getting-started/', '61b'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/user/monthly-sheet/',
                component: ComponentCreator('/docs/user/monthly-sheet/', '687'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/',
                component: ComponentCreator('/docs/', 'ec3'),
                exact: true,
                sidebar: "docsSidebar"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];
