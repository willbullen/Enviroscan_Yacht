import { useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export function ThemeToggle() {
  const [currentTheme, setCurrentTheme] = useState<"light" | "dark">("dark");
  const { toast } = useToast();

  // Initialize theme on component mount
  useEffect(() => {
    // Try to load from localStorage first
    const savedTheme = localStorage.getItem("theme-mode");
    
    if (savedTheme === "light" || savedTheme === "dark") {
      setCurrentTheme(savedTheme);
      document.documentElement.setAttribute("data-theme", savedTheme);
    } else {
      // Default to dark theme if no saved preference
      const defaultTheme = "dark";
      setCurrentTheme(defaultTheme);
      document.documentElement.setAttribute("data-theme", defaultTheme);
      localStorage.setItem("theme-mode", defaultTheme);
    }
  }, []);

  // Toggle between light and dark themes
  const toggleTheme = () => {
    const newTheme = currentTheme === "light" ? "dark" : "light";
    
    // Update state
    setCurrentTheme(newTheme);
    
    // Update DOM
    document.documentElement.setAttribute("data-theme", newTheme);
    
    // Save preference
    localStorage.setItem("theme-mode", newTheme);
    
    // Optional: try to update on server (don't block on failure)
    fetch('/api/update-theme', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appearance: newTheme,
        variant: "vibrant",
        primary: "blue",
        radius: 0.5
      })
    }).catch(() => {
      // Silent failure - theme still works locally
    });
    
    // Notify user
    toast({
      title: "Theme Changed",
      description: `Switched to ${newTheme} mode`,
    });
  };

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={toggleTheme}
      title={`Switch to ${currentTheme === 'light' ? 'dark' : 'light'} mode`}
    >
      {currentTheme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
    </Button>
  );
}