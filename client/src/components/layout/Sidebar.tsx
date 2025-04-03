import { useLocation, Link } from "wouter";
import { cn } from "@/lib/utils";
import { 
  Home, 
  CheckSquare, 
  Settings, 
  Wrench, 
  Package, 
  FileText, 
  Calendar as CalendarIcon,
  Zap, 
  Lightbulb,
  Navigation, 
  ShieldCheck,
  LogOut,
  BarChart4,
  ClipboardCheck,
  Users
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Dashboard", icon: <Home className="h-5 w-5 mr-3" /> },
    { href: "/tasks", label: "Tasks", icon: <CheckSquare className="h-5 w-5 mr-3" /> },
    { href: "/equipment", label: "Equipment", icon: <Wrench className="h-5 w-5 mr-3" /> },
    { href: "/inventory", label: "Inventory", icon: <Package className="h-5 w-5 mr-3" /> },
    { href: "/predictive-maintenance", label: "Predictive Maintenance", icon: <BarChart4 className="h-5 w-5 mr-3" /> },
    { href: "/ism-management", label: "ISM Management", icon: <ClipboardCheck className="h-5 w-5 mr-3" /> },
    { href: "/crew-management", label: "Crew Management", icon: <Users className="h-5 w-5 mr-3" /> },
    { href: "/reports", label: "Reports", icon: <FileText className="h-5 w-5 mr-3" /> },
    { href: "/calendar", label: "Calendar", icon: <CalendarIcon className="h-5 w-5 mr-3" /> },
  ];

  const systemItems = [
    { href: "/mechanical", label: "Mechanical", icon: <Zap className="h-5 w-5 mr-3" /> },
    { href: "/electrical", label: "Electrical", icon: <Lightbulb className="h-5 w-5 mr-3" /> },
    { href: "/navigation", label: "Navigation", icon: <Navigation className="h-5 w-5 mr-3" /> },
    { href: "/safety", label: "Safety", icon: <ShieldCheck className="h-5 w-5 mr-3" /> },
  ];

  return (
    <div
      className={cn(
        "bg-navy-dark text-white w-64 flex-shrink-0 fixed inset-y-0 left-0 transform transition-transform duration-200 ease-in-out z-30",
        "md:translate-x-0 md:static md:inset-auto",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      {/* Sidebar Header - Desktop */}
      <div className="hidden md:flex items-center p-4 border-b border-navy">
        <img
          src="https://images.unsplash.com/photo-1659212209972-21e614984595?w=60&h=60&auto=format&crop=faces&fit=crop"
          alt="Yacht Logo"
          className="h-10 w-10 rounded-full mr-3"
        />
        <span className="font-semibold">IDEA YACHT</span>
      </div>

      <div className="flex flex-col h-full overflow-y-auto">
        {/* User Profile */}
        <div className="p-4 border-b border-navy flex items-center">
          <img
            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&auto=format&fit=crop"
            alt="User Avatar"
            className="rounded-full h-10 w-10 mr-3"
          />
          <div>
            <p className="font-semibold">Captain Smith</p>
            <p className="text-xs text-gray-300">Chief Engineer</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-2">
          <div className="mb-4">
            <p className="px-4 text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Main
            </p>
            {navItems.map((item) => (
              <div key={item.href} className="mb-1">
                <Link href={item.href}>
                  <div
                    className={cn(
                      "flex items-center px-4 py-2 text-sm rounded-md cursor-pointer",
                      location === item.href
                        ? "bg-navy"
                        : "hover:bg-navy"
                    )}
                    onClick={() => setIsOpen(true)}
                  >
                    {item.icon}
                    {item.label}
                  </div>
                </Link>
              </div>
            ))}
          </div>

          <div className="mb-4">
            <p className="px-4 text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Yacht Systems
            </p>
            {systemItems.map((item) => (
              <div key={item.href} className="mb-1">
                <Link href={item.href}>
                  <div
                    className={cn(
                      "flex items-center px-4 py-2 text-sm rounded-md cursor-pointer",
                      location === item.href
                        ? "bg-navy"
                        : "hover:bg-navy"
                    )}
                    onClick={() => setIsOpen(true)}
                  >
                    {item.icon}
                    {item.label}
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="mt-auto p-4 border-t border-navy">
          <Link href="/settings">
            <div className="flex items-center text-sm hover:text-gray-300 cursor-pointer">
              <Settings className="h-5 w-5 mr-2" />
              Settings
            </div>
          </Link>
          <Link href="/logout">
            <div className="flex items-center text-sm hover:text-gray-300 mt-3 cursor-pointer">
              <LogOut className="h-5 w-5 mr-2" />
              Logout
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
