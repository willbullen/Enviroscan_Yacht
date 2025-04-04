import { ReactNode, useState } from 'react';
import { Link } from 'wouter';
import { 
  Menu,
  Bell,
  MessageSquare,
  Search,
  ChevronDown,
  User,
  LogOut,
  Settings,
  Anchor 
} from 'lucide-react';
import { useAppSettings } from '@/config/app-settings';

type HeaderProps = {
  toggleSidebar: () => void;
}

const Header = ({ toggleSidebar }: HeaderProps) => {
  const { setAppSidebarCollapsed } = useAppSettings();
  const [showSearch, setShowSearch] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleToggleSearch = () => {
    setShowSearch(!showSearch);
  };

  const handleToggleNotification = () => {
    setShowNotification(!showNotification);
    setShowMessage(false);
    setShowUserMenu(false);
  };

  const handleToggleMessage = () => {
    setShowMessage(!showMessage);
    setShowNotification(false);
    setShowUserMenu(false);
  };

  const handleToggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
    setShowNotification(false);
    setShowMessage(false);
  };

  const handleSidebarToggle = () => {
    toggleSidebar();
  };

  const notifications = [
    { title: 'Maintenance Due', text: 'Main engine oil change overdue', time: '5 min ago', icon: <Bell className="h-4 w-4" />, color: 'danger' },
    { title: 'Inventory Alert', text: 'Low stock for air filters', time: '15 min ago', icon: <Bell className="h-4 w-4" />, color: 'warning' },
    { title: 'ISM Document', text: 'Safety Manual updated', time: '3 hours ago', icon: <Bell className="h-4 w-4" />, color: 'success' },
  ];

  const messages = [
    { sender: 'Captain Smith', text: 'Need to discuss maintenance schedule', time: '5 min ago', image: 'https://placehold.co/100x100' },
    { sender: 'Chief Engineer', text: 'Engine room inspection complete', time: '20 min ago', image: 'https://placehold.co/100x100' },
    { sender: 'First Officer', text: 'Safety drill report submitted', time: '1 hour ago', image: 'https://placehold.co/100x100' },
  ];

  return (
    <div id="header" className="app-header">
      <div className="navbar-header">
        <Link href="/" className="navbar-brand">
          <span className="navbar-logo">
            <Anchor className="h-6 w-6" />
          </span>
          <span className="ms-2 navbar-brand-text">
            <b>IDEA</b> YACHT
          </span>
        </Link>
        <button type="button" className="navbar-mobile-toggler me-auto" onClick={handleSidebarToggle}>
          <Menu className="h-6 w-6" />
        </button>

        <div className="navbar-mobile-toggler mx-auto">
          <span className="navbar-brand-text">
            <b>IDEA</b> YACHT
          </span>
        </div>

        <button type="button" className="navbar-mobile-toggler" onClick={handleToggleSearch}>
          <Search className="h-6 w-6" />
        </button>
      </div>
      
      <div className={`navbar-container ${showSearch ? 'show' : ''}`}>
        <div className="navbar-input-group">
          <div className="navbar-search-input">
            <Search className="search-icon" />
            <input type="text" className="form-control" placeholder="Search" />
            <button className="btn" type="button" onClick={handleToggleSearch}>
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
        </div>
        <div className="navbar-nav">
          <div className={`navbar-item dropdown ${showNotification ? 'show' : ''}`}>
            <button className="navbar-link dropdown-toggle" onClick={handleToggleNotification}>
              <Bell className="h-5 w-5" />
              <span className="navbar-badge">3</span>
            </button>
            {showNotification && (
              <div className="dropdown-menu dropdown-menu-end navbar-notifications">
                <div className="dropdown-notifications-header">
                  Notifications (3)
                </div>
                <div className="dropdown-notifications-body">
                  {notifications.map((notification, index) => (
                    <div className="dropdown-notifications-item" key={index}>
                      <div className={`item-icon bg-${notification.color}`}>
                        {notification.icon}
                      </div>
                      <div className="item-info">
                        <div className="item-title">{notification.title}</div>
                        <div className="item-desc">{notification.text}</div>
                        <div className="item-time">{notification.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="dropdown-notifications-footer">
                  <Link href="/notifications">View All</Link>
                </div>
              </div>
            )}
          </div>
          
          <div className={`navbar-item dropdown ${showMessage ? 'show' : ''}`}>
            <button className="navbar-link dropdown-toggle" onClick={handleToggleMessage}>
              <MessageSquare className="h-5 w-5" />
              <span className="navbar-badge">3</span>
            </button>
            {showMessage && (
              <div className="dropdown-menu dropdown-menu-end navbar-messages">
                <div className="dropdown-messages-header">
                  Messages (3)
                </div>
                <div className="dropdown-messages-body">
                  {messages.map((message, index) => (
                    <div className="dropdown-messages-item" key={index}>
                      <div className="item-image">
                        <img src={message.image} alt={message.sender} />
                      </div>
                      <div className="item-info">
                        <div className="item-title">{message.sender}</div>
                        <div className="item-desc">{message.text}</div>
                        <div className="item-time">{message.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="dropdown-messages-footer">
                  <Link href="/messages">View All</Link>
                </div>
              </div>
            )}
          </div>
          
          <div className={`navbar-item dropdown ${showUserMenu ? 'show' : ''}`}>
            <button className="navbar-link dropdown-toggle" onClick={handleToggleUserMenu}>
              <img src="https://placehold.co/100x100" alt="Profile" className="navbar-user-img" />
              <span className="d-none d-md-inline">Admin</span>
              <ChevronDown className="h-4 w-4 ms-1" />
            </button>
            {showUserMenu && (
              <div className="dropdown-menu dropdown-menu-end navbar-user-menu">
                <Link href="/profile" className="dropdown-item">
                  <User className="h-4 w-4 me-2" />
                  Profile
                </Link>
                <Link href="/settings" className="dropdown-item">
                  <Settings className="h-4 w-4 me-2" />
                  Settings
                </Link>
                <div className="dropdown-divider"></div>
                <Link href="/logout" className="dropdown-item">
                  <LogOut className="h-4 w-4 me-2" />
                  Log Out
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;