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
          id: 'component',
          title: 'नवीन कर्मचारी',
          type: 'item',
          icon: 'fa-solid fa-users',
          url: '/empmaster'
        },
        {
          id: 'attendance',
          title: 'कर्मचारी उपस्थिती',
          type: 'item',
          icon: 'fa-solid fa-clock',
          url: '/attendance'
        },
        {
          id: 'leave',
          title: 'कर्मचारी रजा',
          type: 'item',
          icon: 'fa-solid fa-calendar-times',
          url: '/leave'
        },
        {
          id: 'donvotee',
          title: 'देणगीदार',
          type: 'item',
          icon: 'fa-solid fa-hand-holding-dollar',
          url: '/devotee'
        },
        {
          id: 'stock',
          title: 'स्टॉक व्यवस्थापन',
          type: 'item',
          icon: 'fa-solid fa-warehouse',
          url: '/stock'
        },
        {
          id: 'dengipawti',
          title: 'देणगी पावती',
          type: 'item',
          icon: 'fa-solid fa-hand-holding-dollar',
          url: '/dengipawti'
        },
        // {
        //   id: 'whatsappinstance',
        //   title: 'व्हाट्सअॅप इन्स्टन्स',
        //   type: 'item',
        //   icon: 'fa-solid fa-hand-holding-dollar',
        //   url: '/whatsappinstance'
        // },

        {
          id: 'gosevareceipt',
          title: 'गोसेवा पावती',
          type: 'item',
          icon: 'fa-solid fa-hand-holding-dollar',
          url: '/gosevareceipt'
        },
        {
          id: 'pooja',
          title: 'सेवेचे प्रकार',
          type: 'item',
          icon: 'fa-solid fa-hands-praying',
          url: '/pooja'
        },
        {
          id: 'gotra',
          title: 'गोत्र',
          type: 'item',
          icon: 'fa-solid fa-people-roof',
          url: '/gotra'
        },
        {
          id: 'temple',
          title: 'मंदिर नोंदणी',
          type: 'item',
          icon: 'fa-solid fa-gopuram',
          url: '/templereg'
        },

        {
          id: 'cowregister',
          title: 'गाय नोंदणी',
          type: 'item',
          icon: 'fa-solid fa-gopuram',
          url: '/cowregister'
        },

        {
          id: 'cowmanagement',
          title: 'गाय व्यवस्थापन',
          type: 'item',
          icon: 'fa-solid fa-gopuram',
          url: '/cowmanagement'
        },

        {
          id: 'cowprescription',
          title: 'गाय पर्ची',
          type: 'item',
          icon: 'fa-solid fa-gopuram',
          url: '/cowprescription'
        },

        // {
        //   id: 'counterMaster',
        //   title: 'काउंटर नोंदणी',
        //   type: 'item',
        //   icon: 'fa-solid fa-circle-dollar-to-slot',
        //   url: '/countermaster'
        // },
        // {
        //   id: 'counterType',
        //   title: 'काउंटर प्रकार',
        //   type: 'item',
        //   icon: 'fa-solid fa-circle-dollar-to-slot',
        //   url: '/countertype'
        // },
        {
          id: 'cashbook',
          title: 'रोख नोंदवही',
          type: 'item',
          icon: 'fa-solid fa-file-invoice',
          url: '/cashbook'
        },
        {
          id: 'income',
          title: 'उत्पन्न',
          type: 'item',
          icon: 'fa-solid fa-file-invoice',
          url: '/income'
        },
        {
          id: 'expenses',
          title: 'खर्च',
          type: 'item',
          icon: 'fa-solid fa-file-invoice',
          url: '/expenses'
        },
        {
          id: 'reports',
          title: 'अहवाल',
          type: 'collapse',
          icon: 'fa-solid fa-flag',
          children: [
            // {
            //   id: 'totalEmp',
            //   title: 'एकूण कर्मचारी',
            //   type: 'item',
            //   url: '/reports/totalemp'
            // },
            // {
            //   id: 'totalDonar',
            //   title: 'एकूण दाता',
            //   type: 'item',
            //   url: '/reports/totaldonar'
            // },
            {
              id: 'totalDevotee',
              title: 'देणगीदार',
              type: 'item',
              url: '/reports/totaldevotee'
            },
            {
              id: 'totalDevotee',
              title: 'देणगीदार पावती',
              type: 'item',
              url: '/reports/totaldevoteepawti'
            },
            // {
            //   id: 'dailytran',
            //   title: 'दैनंदिन व्यवहार',
            //   type: 'item',
            //   url: '/reports/dailytran'
            // },
            {
              id: 'gosevareceiptpawti',
              title: 'गोसेवा पावती',
              type: 'item',
              url: '/reports/totalgosevareceiptpawti'
            },
            {
              id: 'reportsincome',
              title: 'उत्पन्न अहवाल',
              type: 'item',
              url: '/reports/income'
            },
            {
              id: 'reportsexpenses',
              title: 'खर्च अहवाल',
              type: 'item',
              url: '/reports/expenses'
            },
            {
              id: 'attendancereport',
              title: 'कर्मचारी उपस्थिती अहवाल',
              type: 'item',
              url: '/reports/attendance'
            },
            {
              id: 'leavereport',
              title: 'कर्मचारी रजा अहवाल',
              type: 'item',
              url: '/reports/leave'
            },
            {
              id: 'combinedreport',
              title: 'एकत्रित कर्मचारी अहवाल',
              type: 'item',
              url: '/reports/combined'
            }
          ]
        }
      ]
    }

    // url: '/app/templeMaster',
    // children: [
    // {
    //   id: 'button',
    //   title: 'Button',
    //   type: 'item',
    //   url: '/basic/button'
    // }

    // {
    //   id: 'badges',
    //   title: 'Badges',
    //   type: 'item',
    //   url: '/basic/badges'
    // },
    // {
    //   id: 'breadcrumb-pagination',
    //   title: 'Breadcrumb & Pagination',
    //   type: 'item',
    //   url: '/basic/breadcrumb-pagination'
    // },
    // {
    //   id: 'collapse',
    //   title: 'Collapse',
    //   type: 'item',
    //   url: '/basic/collapse'
    // },
    // {
    //   id: 'typography',
    //   title: 'Typography',
    //   type: 'item',
    //   url: '/basic/typography'
    // },
    // {
    //   id: 'tooltip-popovers',
    //   title: 'Tooltip & Popovers',
    //   type: 'item',
    //   url: '/basic/tooltip-popovers'
    // }
  ]
};

// {
//   id: 'auth',
//   title: 'Authentication',
//   type: 'group',
//   icon: 'icon-pages',
//   children: [
//     {
//       id: 'sign in',
//       title: 'Login',
//       type: 'item',
//       icon: 'feather icon-lock',
//       url: '/',
//       target: true,
//       breadcrumbs: false
//     },
// {
//   id: 'sign Up',
//   title: 'Register',
//   type: 'item',
//   icon: 'feather icon-log-in',
//   url: '/auth/signup-1',
//   target: true,
//   breadcrumbs: false
// },
// {
//   id: 'reset-pass',
//   title: 'Change Password',
//   type: 'item',
//   icon: 'feather icon-unlock',
//   url: '/reset-password',
//   target: true,
//   breadcrumbs: false
// }
//   ]
// }
// ]
// {
//   id: 'support',
//   title: 'Support',
//   type: 'group',
//   icon: 'icon-support',
//   children: [
//     {
//       id: 'sample-page',
//       title: 'Sample Page',
//       type: 'item',
//       url: '/sample-page',
//       classes: 'nav-item',
//       icon: 'feather icon-sidebar'
//     },
//     {
//       id: 'documentation',
//       title: 'Documentation',
//       type: 'item',
//       icon: 'feather icon-help-circle',
//       classes: 'nav-item',
//       url: 'https://codedthemes.gitbook.io/gradient-able-react/',
//       target: true,
//       external: true
//     }
//   ]
// }

export default menuItems;
