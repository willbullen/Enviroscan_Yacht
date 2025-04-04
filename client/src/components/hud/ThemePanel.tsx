import { useState } from 'react';
import { Palette, X, Sun, Moon } from 'lucide-react';

interface ThemePanelProps {
  currentTheme: string;
  onThemeChange: (theme: string) => void;
  themeMode: string;
  onThemeModeChange: (mode: string) => void;
}

export const ThemePanel = ({ 
  currentTheme, 
  onThemeChange,
  themeMode,
  onThemeModeChange
}: ThemePanelProps) => {
  const [active, setActive] = useState(false);

  const togglePanel = () => {
    setActive(!active);
  };

  const themes = [
    { name: 'Default', class: 'theme-teal' },
    { name: 'Blue', class: 'theme-blue' },
    { name: 'Purple', class: 'theme-purple' },
    { name: 'Orange', class: 'theme-orange' },
    { name: 'Green', class: 'theme-green' },
    { name: 'Red', class: 'theme-red' },
    { name: 'Gray', class: 'theme-gray' },
    { name: 'Yellow', class: 'theme-yellow' }
  ];

  return (
    <div className={`theme-panel ${active ? 'active' : ''}`}>
      <button className="theme-panel-expand-toggle" onClick={togglePanel}>
        <Palette className="fa-lg" />
      </button>
      <div className="theme-panel-content">
        <div className="theme-panel-header">
          <button className="close" onClick={togglePanel}>
            <X />
          </button>
          <h5>Theme Options</h5>
        </div>
        <div className="theme-panel-body">
          <div className="theme-panel-options mb-4">
            <h6 className="mb-3">Dark Mode</h6>
            <div className="theme-mode-options">
              <button 
                className={`btn ${themeMode === 'light' ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => onThemeModeChange('light')}
              >
                <Sun className="h-4 w-4 me-1" />
                Light
              </button>
              <button 
                className={`btn ${themeMode === 'dark' ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => onThemeModeChange('dark')}
              >
                <Moon className="h-4 w-4 me-1" />
                Dark
              </button>
            </div>
          </div>
          <div className="theme-panel-options">
            <h6 className="mb-3">Theme Colors</h6>
            <div className="theme-list">
              {themes.map((theme, index) => (
                <div 
                  key={index}
                  className={`theme-item ${currentTheme === theme.class ? 'active' : ''}`}
                  onClick={() => onThemeChange(theme.class)}
                >
                  <div className={`theme-color ${theme.class}`}></div>
                  <div className="theme-name">{theme.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};