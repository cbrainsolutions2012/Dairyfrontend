const menuItems = {
  items: [
    {
      id: 'navigation',
      title: 'Navigation',
      type: 'group',
      icon: 'icon-navigation',
      children: [
        {
          id: 'dashboard',
          title: 'Dashboard',
          type: 'item',
          icon: 'feather icon-home',
          url: '/dashboard'
        }
      ]
    },
    {
      id: 'utilities',
      title: 'Utilities',
      type: 'group',
      icon: 'icon-ui',
      children: [
        {
          id: 'buyers',
          title: 'Buyers',
          type: 'item',
          icon: 'feather icon-users',
          url: '/buyers'
        },
        {
          id: 'sellers',
          title: 'Sellers',
          type: 'item',
          icon: 'feather icon-users',
          url: '/sellers'
        },
        {
          id: 'milkstore',
          title: 'Milk Store',
          type: 'item',
          icon: 'feather icon-box',
          url: '/milkstore'
        },
        {
          id: 'milkdistribution',
          title: 'Milk Distribution',
          type: 'item',
          icon: 'feather icon-box',
          url: '/milkdistribution'
        },
        {
          id: 'buyers-payment',
          title: 'Buyers Payment',
          type: 'item',
          icon: 'feather icon-credit-card',
          url: '/buyers-payment'
        },
        {
          id: 'sellers-payment',
          title: 'Sellers Payment',
          type: 'item',
          icon: 'feather icon-credit-card',
          url: '/sellers-payment'
        },
        {
          id: 'income',
          title: 'Income',
          type: 'item',
          icon: 'feather icon-credit-card',
          url: '/income'
        },
        {
          id: 'expenses',
          title: 'Expenses',
          type: 'item',
          icon: 'feather icon-credit-card',
          url: '/expenses'
        }
      ]
    }
    // Add your new menu groups here as you create new components
    // Example:
    // {
    //   id: 'main-modules',
    //   title: 'Main Modules',
    //   type: 'group',
    //   icon: 'icon-ui',
    //   children: [
    //     {
    //       id: 'users',
    //       title: 'User Management',
    //       type: 'item',
    //       icon: 'fa-solid fa-users',
    //       url: '/users'
    //     },
    //     {
    //       id: 'products',
    //       title: 'Product Management',
    //       type: 'item',
    //       icon: 'fa-solid fa-box',
    //       url: '/products'
    //     }
    //   ]
    // }
  ]
};

export default menuItems;
