import { DashboardIcon, PlusIcon, TemplateIcon } from 'vue-tabler-icons';

export interface menu {
  header?: string;
  title?: string;
  icon?: object;
  to?: string;
  divider?: boolean;
  chip?: string;
  chipColor?: string;
  chipVariant?: string;
  chipIcon?: string;
  children?: menu[];
  disabled?: boolean;
  type?: string;
  subCaption?: string;
}

const sidebarItem: menu[] = [
  {
    title: 'New',
    icon: PlusIcon,
    to: '/project/new'
  },
  { divider: true },
  {
    title: 'Projects',
    icon: DashboardIcon,
    to: '/dashboard/default'
  },

  {
    title: 'Templates',
    icon: TemplateIcon,
    to: '/dashboard/default'
  }

  // { header: 'Pages' },
  // {
  //   title: 'Authentication',
  //   icon: KeyIcon,
  //   to: '/auth',
  //   children: [
  //     {
  //       title: 'Login',
  //       icon: CircleIcon,
  //       to: '/auth/login'
  //     },
  //     {
  //       title: 'Register',
  //       icon: CircleIcon,
  //       to: '/auth/register'
  //     }
  //   ]
  // }
];

export default sidebarItem;
