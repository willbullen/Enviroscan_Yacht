import { ReactNode } from 'react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Wrench, 
  Package, 
  FileText, 
  CalendarIcon,
  BarChart3, 
  ClipboardCheck,
  Users,
  DollarSign,
  Zap, 
  Lightbulb,
  Navigation, 
  ShieldCheck,
  Settings,
} from "lucide-react";

interface MenuItem {
  path?: string;
  icon?: ReactNode;
  title?: string;
  label?: string;
  highlight?: boolean;
  badge?: ReactNode;
  children?: MenuItem[];
  is_header?: boolean;
  is_divider?: boolean;
}

const Menu: MenuItem[] = [
  { is_header: true, title: 'Navigation' },
  { 
    path: '/', 
    icon: <LayoutDashboard className="h-5 w-5" />, 
    title: 'Dashboard' 
  },
  { 
    path: '/tasks', 
    icon: <CheckSquare className="h-5 w-5" />, 
    title: 'Tasks' 
  },
  { 
    path: '/equipment', 
    icon: <Wrench className="h-5 w-5" />, 
    title: 'Equipment' 
  },
  { 
    path: '/inventory', 
    icon: <Package className="h-5 w-5" />, 
    title: 'Inventory' 
  },
  { 
    path: '/predictive-maintenance', 
    icon: <BarChart3 className="h-5 w-5" />, 
    title: 'Predictive Maintenance',
    highlight: true,
  },
  { 
    path: '/ism-management', 
    icon: <ClipboardCheck className="h-5 w-5" />, 
    title: 'ISM Management',
    children: [
      { path: '/ism-management/documents', title: 'Documents' },
      { path: '/ism-management/audits', title: 'Audits' },
      { path: '/ism-management/training', title: 'Training' },
      { path: '/ism-management/incidents', title: 'Incidents' },
    ]
  },
  { 
    path: '/crew-management', 
    icon: <Users className="h-5 w-5" />, 
    title: 'Crew Management' 
  },
  { 
    path: '/financial-management', 
    icon: <DollarSign className="h-5 w-5" />, 
    title: 'Financial Management' 
  },
  { 
    path: '/reports', 
    icon: <FileText className="h-5 w-5" />, 
    title: 'Reports' 
  },
  { 
    path: '/calendar', 
    icon: <CalendarIcon className="h-5 w-5" />, 
    title: 'Calendar' 
  },

  { is_divider: true },
  { is_header: true, title: 'Yacht Systems' },
  { 
    path: '/mechanical', 
    icon: <Zap className="h-5 w-5" />, 
    title: 'Mechanical' 
  },
  { 
    path: '/electrical', 
    icon: <Lightbulb className="h-5 w-5" />, 
    title: 'Electrical' 
  },
  { 
    path: '/navigation', 
    icon: <Navigation className="h-5 w-5" />, 
    title: 'Navigation' 
  },
  { 
    path: '/safety', 
    icon: <ShieldCheck className="h-5 w-5" />, 
    title: 'Safety' 
  },
  
  { is_divider: true },
  { is_header: true, title: 'Settings' },
  { 
    path: '/settings', 
    icon: <Settings className="h-5 w-5" />,
    title: 'Settings' 
  },
];

export default Menu;