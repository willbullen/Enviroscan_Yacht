import { useState, useEffect } from "react";
import { themes } from "./theme-provider";
import { Button } from "@/components/ui/button";

type Theme = {
  variant: "professional" | "tint" | "vibrant";
  primary: string;
  appearance: "light" | "dark" | "system";
  radius: number;
};
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Moon, Sun, Laptop, Palette } from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

export function ThemeSwitcher() {
  // Initialize with default theme
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const savedTheme = localStorage.getItem("yacht-theme");
      return savedTheme ? JSON.parse(savedTheme) : themes.light;
    } catch (e) {
      console.error("Failed to parse saved theme", e);
      return themes.light;
    }
  });
  
  const [customizeOpen, setCustomizeOpen] = useState<boolean>(false);
  const [customTheme, setCustomTheme] = useState<Theme>(theme);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("yacht-theme", JSON.stringify(newTheme));
    document.documentElement.setAttribute("data-theme", newTheme.appearance);
    
    // Update theme.json via an API call
    fetch('/api/update-theme', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newTheme),
    }).catch(error => {
      console.error('Failed to update theme.json:', error);
    });
  };

  // Icons for different themes
  const icons = {
    light: <Sun className="h-5 w-5" />,
    dark: <Moon className="h-5 w-5" />,
    system: <Laptop className="h-5 w-5" />,
    custom: <Palette className="h-5 w-5" />,
  };

  // Get the current icon based on appearance
  const getCurrentIcon = () => {
    if (theme.appearance === "light") return icons.light;
    if (theme.appearance === "dark") return icons.dark;
    if (theme.appearance === "system") return icons.system;
    return icons.light;
  };

  // Apply the custom theme
  const applyCustomTheme = () => {
    setTheme(customTheme);
    setCustomizeOpen(false);
  };

  // Cancel custom theme changes
  const cancelCustomTheme = () => {
    setCustomTheme(theme);
    setCustomizeOpen(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            {getCurrentIcon()}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Choose Theme</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => setTheme(themes.light)}>
            <Sun className="mr-2 h-4 w-4" />
            <span>Light</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => setTheme(themes.dark)}>
            <Moon className="mr-2 h-4 w-4" />
            <span>Dark</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => setTheme(themes.system)}>
            <Laptop className="mr-2 h-4 w-4" />
            <span>System</span>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuLabel>Theme Presets</DropdownMenuLabel>
          
          <DropdownMenuItem onClick={() => setTheme(themes.ocean)}>
            <span className="w-4 h-4 rounded-full bg-[hsl(195,83%,38%)] mr-2"></span>
            <span>Ocean</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => setTheme(themes.sunset)}>
            <span className="w-4 h-4 rounded-full bg-[hsl(25,95%,53%)] mr-2"></span>
            <span>Sunset</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => setTheme(themes.midnight)}>
            <span className="w-4 h-4 rounded-full bg-[hsl(250,60%,30%)] mr-2"></span>
            <span>Midnight</span>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DialogTrigger asChild onClick={() => setCustomizeOpen(true)}>
            <DropdownMenuItem>
              <Palette className="mr-2 h-4 w-4" />
              <span>Customize</span>
            </DropdownMenuItem>
          </DialogTrigger>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={customizeOpen} onOpenChange={setCustomizeOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Customize Theme</DialogTitle>
            <DialogDescription>
              Adjust the theme settings to match your preferences.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="appearance" className="text-right">
                Mode
              </Label>
              <Select
                value={customTheme.appearance}
                onValueChange={(value) =>
                  setCustomTheme({
                    ...customTheme,
                    appearance: value as "light" | "dark" | "system",
                  })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select appearance" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="variant" className="text-right">
                Variant
              </Label>
              <Select
                value={customTheme.variant}
                onValueChange={(value) =>
                  setCustomTheme({
                    ...customTheme,
                    variant: value as "professional" | "tint" | "vibrant",
                  })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select variant" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="tint">Tint</SelectItem>
                  <SelectItem value="vibrant">Vibrant</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="primary" className="text-right">
                Primary Color
              </Label>
              <div className="col-span-3 flex gap-2">
                <div 
                  className="w-8 h-8 rounded-full border" 
                  style={{ backgroundColor: customTheme.primary }}
                />
                <Input
                  id="primary"
                  value={customTheme.primary}
                  onChange={(e) =>
                    setCustomTheme({
                      ...customTheme,
                      primary: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="radius" className="text-right">
                Border Radius
              </Label>
              <div className="col-span-3">
                <Slider
                  id="radius"
                  min={0}
                  max={2}
                  step={0.1}
                  value={[customTheme.radius]}
                  onValueChange={(value) =>
                    setCustomTheme({
                      ...customTheme,
                      radius: value[0],
                    })
                  }
                />
                <div className="mt-1 text-xs text-muted-foreground text-right">
                  {customTheme.radius.toFixed(1)}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={cancelCustomTheme}>
              Cancel
            </Button>
            <Button onClick={applyCustomTheme}>Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}