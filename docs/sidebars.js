/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  docsSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Developer',
      items: [
        'developer/setup',
        'developer/architecture',
        'developer/data-model',
        'developer/frontend',
        'developer/backend',
        'developer/operations',
      ],
    },
    {
      type: 'category',
      label: 'User',
      items: [
        'user/getting-started',
        'user/flow',
        'user/dashboard',
        'user/daily-entry',
        'user/monthly-sheet',
      ],
    },
    {
      type: 'category',
      label: 'Admin',
      items: [
        'admin/overview',
        'admin/flow',
        'admin/users',
        'admin/projects',
        'admin/allocations',
        'admin/review-loe',
      ],
    },
  ],
};

module.exports = sidebars;
