// @ts-check

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'PixelEDGE Documentation',
  tagline: 'Developer, user, and admin guides for the LOE Tracker platform',
  favicon: 'img/logo.svg',
  url: 'http://localhost:3000',
  baseUrl: '/docs/',
  trailingSlash: true,
  onBrokenLinks: 'throw',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },
  organizationName: 'pixel-edge',
  projectName: 'loe-tracker-docs',
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },
  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          path: 'docs',
          routeBasePath: '/',
          sidebarPath: require.resolve('./sidebars.js'),
        },
        blog: false,
        pages: false,
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],
  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: 'PixelEDGE Docs',
        items: [
          { to: '/', label: 'Overview', position: 'left' },
          { to: '/developer/setup', label: 'Developer', position: 'left' },
          { to: '/user/getting-started', label: 'User', position: 'left' },
          { to: '/admin/overview', label: 'Admin', position: 'left' },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Tracks',
            items: [
              { label: 'Developer', to: '/developer/setup' },
              { label: 'User', to: '/user/getting-started' },
              { label: 'Admin', to: '/admin/overview' },
            ],
          },
          {
            title: 'Application',
            items: [
              { label: 'App Home', href: 'http://localhost:3000/dashboard' },
              { label: 'GraphQL', href: 'http://localhost:3001/graphql' },
            ],
          },
        ],
      },
      prism: {
        theme: require('prism-react-renderer').themes.github,
        darkTheme: require('prism-react-renderer').themes.dracula,
      },
    }),
};

module.exports = config;
