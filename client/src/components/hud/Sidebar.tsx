import { useState, useEffect, useRef, ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import PerfectScrollbar from 'react-perfect-scrollbar';
import 'react-perfect-scrollbar/dist/css/styles.css';
import { ChevronDown, ChevronUp, Menu } from 'lucide-react';
import AppMenu from '@/config/app-menu';
import { useAppSettings } from '@/config/app-settings';

type SidebarProps = {
  toggleSidebar?: () => void;
};

const Sidebar = ({ toggleSidebar }: SidebarProps) => {
  const [location] = useLocation();
  const { setAppSidebarCollapsed } = useAppSettings();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.innerWidth <= 992) {
      setAppSidebarCollapsed(true);
    }
    
    handlePageLoadMenuActive();
    
    // eslint-disable-next-line
  }, []);

  const handlePageLoadMenuActive = () => {
    const url = location;
    AppMenu.forEach((menu, i) => {
      if (menu.path === url) {
        const menuItem = document.querySelector(`.menu-item:nth-child(${i+1})`) as HTMLElement;
        if (menuItem) {
          menuItem.classList.add('active');
        }
      } else if (menu.children) {
        menu.children.forEach((submenu) => {
          if (submenu.path === url) {
            const menuItem = document.querySelector(`.menu-item:nth-child(${i+1})`) as HTMLElement;
            if (menuItem) {
              menuItem.classList.add('expand');
              menuItem.classList.add('active');
            }
            setCollapsed(prev => ({
              ...prev,
              [i]: true
            }));
          }
        });
      }
    });
  };

  const handleExpand = (menuKey: number) => {
    setCollapsed(prev => ({
      ...prev,
      [menuKey]: !prev[menuKey]
    }));
  };

  const handleSidebarToggle = () => {
    if (toggleSidebar) {
      toggleSidebar();
    }
  };

  const renderMenu = (menu: any, i: number) => {
    if (menu.is_divider) {
      return <div className="menu-divider" key={i}></div>;
    }
    if (menu.is_header) {
      return <div className="menu-header" key={i}>{menu.title}</div>;
    }

    const showMenu = true;
    const expand = collapsed[i] || false;
    const active = location === menu.path || (menu.children && menu.children.some((submenu: any) => submenu.path === location));
    const subMenus = menu.children ? (
      <div className={`menu-submenu ${expand ? 'show' : ''}`}>
        <div className="menu-item-submenu-list">
          {menu.children.map((submenu: any, j: number) => (
            <div className={`menu-item ${submenu.path === location ? 'active' : ''}`} key={j}>
              <Link href={submenu.path} className="menu-link">
                {submenu.icon && <div className="menu-icon">{submenu.icon}</div>}
                <div className="menu-text">{submenu.title}</div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    ) : null;

    const hasBadge = !!menu.badge;
    const hasIcon = !!menu.icon;
    const hasChildren = !!menu.children;
    const hasHighlight = menu.highlight;

    return (
      showMenu && (
        <div className={`menu-item ${active ? 'active' : ''} ${expand ? 'expand' : ''} ${hasChildren ? 'has-sub' : ''}`} key={i}>
          {menu.path && !menu.children ? (
            <Link 
              href={menu.path} 
              className={`menu-link ${hasHighlight ? 'highlight' : ''}`}
            >
              {hasIcon && <div className="menu-icon">{menu.icon}</div>}
              <div className="menu-text">{menu.title}</div>
              {hasBadge && <div className="menu-badge">{menu.badge}</div>}
            </Link>
          ) : (
            <button 
              onClick={() => handleExpand(i)} 
              className={`menu-link ${hasHighlight ? 'highlight' : ''}`}
            >
              {hasIcon && <div className="menu-icon">{menu.icon}</div>}
              <div className="menu-text">{menu.title}</div>
              {hasBadge && <div className="menu-badge">{menu.badge}</div>}
              {hasChildren && <div className="menu-arrow">{expand ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</div>}
            </button>
          )}
          {subMenus}
        </div>
      )
    );
  };

  return (
    <div id="sidebar" className="app-sidebar">
      <PerfectScrollbar className="app-sidebar-content" options={{ suppressScrollX: true }}>
        <div className="menu">
          {AppMenu.map((menu, i) => renderMenu(menu, i))}
        </div>
      </PerfectScrollbar>
      
      <button className="menu-toggler mobile-toggler d-block d-lg-none" onClick={handleSidebarToggle}>
        <Menu />
      </button>
    </div>
  );
};

export default Sidebar;