import { useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const { toast } = useToast();

  // On mount, load the theme from localStorage or use system preference
  useEffect(() => {
    // First try loading from theme.json
    const loadTheme = async () => {
      try {
        // First check if we have a saved theme
        const storedTheme = localStorage.getItem("theme");
        if (storedTheme) {
          try {
            const parsed = JSON.parse(storedTheme);
            if (parsed.appearance === "dark" || parsed.appearance === "light") {
              setTheme(parsed.appearance);
              document.documentElement.setAttribute("data-theme", parsed.appearance);
              return;
            }
          } catch (e) {
            console.error("Failed to parse theme from localStorage", e);
          }
        }
        
        // Define a default theme instead of trying to fetch theme.json
        // This is a fallback for when localStorage isn't available
        const defaultTheme = { 
          appearance: "dark",
          variant: "vibrant", 
          primary: "blue", 
          radius: 0.5 
        };
        
        setTheme(defaultTheme.appearance);
        document.documentElement.setAttribute("data-theme", defaultTheme.appearance);
        
        // Save default to localStorage for future use
        localStorage.setItem("theme", JSON.stringify(defaultTheme));
        return;
      } catch (error) {
        console.error("Theme initialization error:", error);
        // Default to light theme if all else fails
        setTheme("light");
        document.documentElement.setAttribute("data-theme", "light");
      }
    };
    
    loadTheme();
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    
    // Save to localStorage
    try {
      // Keep the existing theme settings if any, just update the appearance
      let themeData = { appearance: newTheme, variant: "vibrant", primary: "blue", radius: 0.5 };
      const storedTheme = localStorage.getItem("theme");
      if (storedTheme) {
        const parsed = JSON.parse(storedTheme);
        themeData = { ...parsed, appearance: newTheme };
      }
      
      localStorage.setItem("theme", JSON.stringify(themeData));
      
      // Update root element
      document.documentElement.setAttribute("data-theme", newTheme);
      
      // Also try to update theme.json via API but don't wait for it
      fetch('/api/update-theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(themeData)
      }).catch(error => {
        console.log('Theme saved locally. Server update optional:', error);
      });
      
      toast({
        title: "Theme updated",
        description: `Switched to ${newTheme} mode.`,
      });
    } catch (e) {
      console.error("Failed to update theme", e);
    }
  };

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={toggleTheme}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
    </Button>
  );
}