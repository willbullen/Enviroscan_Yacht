import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = {
  variant: "professional" | "tint" | "vibrant";
  primary: string;
  appearance: "light" | "dark" | "system";
  radius: number;
};

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
};

type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const defaultTheme: Theme = {
  variant: "professional",
  primary: "hsl(203, 71%, 40%)",
  appearance: "light",
  radius: 0.5,
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({
  children,
  defaultTheme: themeParam,
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    // Try to get the theme from localStorage first
    const savedTheme = localStorage.getItem("yacht-theme");
    if (savedTheme) {
      try {
        return JSON.parse(savedTheme);
      } catch (e) {
        console.error("Failed to parse saved theme", e);
      }
    }
    // Fall back to the provided default or the hardcoded default
    return themeParam || defaultTheme;
  });

  useEffect(() => {
    // Save theme to localStorage whenever it changes
    localStorage.setItem("yacht-theme", JSON.stringify(theme));

    // Apply the theme to the JSON file
    // This is a client-side effect, but we can update a data attribute for styling
    document.documentElement.setAttribute("data-theme", theme.appearance);
    
    // Update theme.json via an API call
    fetch('/api/update-theme', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(theme),
    }).catch(error => {
      console.error('Failed to update theme.json:', error);
    });
  }, [theme]);

  // Handle system preference changes for "system" appearance
  useEffect(() => {
    if (theme.appearance !== "system") return;
    
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
    const handleChange = () => {
      document.documentElement.setAttribute(
        "data-theme", 
        mediaQuery.matches ? "dark" : "light"
      );
    };
    
    mediaQuery.addEventListener("change", handleChange);
    // Set initial value
    handleChange();
    
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme.appearance]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

// Predefined themes
export const themes = {
  light: {
    variant: "professional",
    primary: "hsl(203, 71%, 40%)", // Navy blue
    appearance: "light",
    radius: 0.5,
  } as Theme,
  
  dark: {
    variant: "professional",
    primary: "hsl(203, 71%, 40%)", // Navy blue
    appearance: "dark",
    radius: 0.5,
  } as Theme,

  ocean: {
    variant: "tint",
    primary: "hsl(195, 83%, 38%)", // Ocean blue
    appearance: "light",
    radius: 0.75,
  } as Theme,

  sunset: {
    variant: "vibrant",
    primary: "hsl(25, 95%, 53%)", // Sunset orange
    appearance: "light",
    radius: 1,
  } as Theme,

  midnight: {
    variant: "tint",
    primary: "hsl(250, 60%, 30%)", // Midnight purple
    appearance: "dark",
    radius: 0.5,
  } as Theme,
  
  system: {
    variant: "professional",
    primary: "hsl(203, 71%, 40%)", // Navy blue
    appearance: "system",
    radius: 0.5,
  } as Theme,
};