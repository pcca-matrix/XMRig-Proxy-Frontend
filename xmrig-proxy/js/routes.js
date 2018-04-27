var routes = [
  // Index page
  {
    path: '/',
    url: './index.html',
    name: 'home',
  },  
  // Workers page
  {
    path: '/workers',
    url: './pages/workers.html',
    name: 'workers',
  },  
  // Settings page
  {
    path: '/settings',
    url: './pages/settings.html',
    name: 'settings',
  },
  // Change Pool page
  {
    path: '/ch_pool',
    url: './pages/ch_pool.html',
    name: 'ch_pool',
  },
  // Default route (404 page). MUST BE THE LAST
  {
    path: '(.*)',
    url: './pages/404.html',
  },
];
