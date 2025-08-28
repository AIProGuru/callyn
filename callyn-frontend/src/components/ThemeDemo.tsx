import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useTheme } from "@/context/ThemeProvider";
import { Sun, Moon, Palette } from "lucide-react";

const ThemeDemo = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Theme Demo</h2>
          <p className="text-muted-foreground">See how the theming system works across the platform</p>
        </div>
        <ThemeToggle />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Current Theme Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Current Theme
            </CardTitle>
            <CardDescription>Your current theme settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Active Theme:</span>
              <Badge variant={theme === 'dark' ? 'default' : 'secondary'}>
                {theme === 'dark' ? (
                  <>
                    <Moon className="h-3 w-3 mr-1" />
                    Dark
                  </>
                ) : (
                  <>
                    <Sun className="h-3 w-3 mr-1" />
                    Light
                  </>
                )}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={theme === 'light' ? 'default' : 'outline'}
                onClick={() => setTheme('light')}
                className="flex-1"
              >
                <Sun className="h-4 w-4 mr-1" />
                Light
              </Button>
              <Button
                size="sm"
                variant={theme === 'dark' ? 'default' : 'outline'}
                onClick={() => setTheme('dark')}
                className="flex-1"
              >
                <Moon className="h-4 w-4 mr-1" />
                Dark
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Color Palette */}
        <Card>
          <CardHeader>
            <CardTitle>Color Palette</CardTitle>
            <CardDescription>Theme-aware color system</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="h-8 bg-primary rounded flex items-center justify-center text-primary-foreground text-xs">
                Primary
              </div>
              <div className="h-8 bg-secondary rounded flex items-center justify-center text-secondary-foreground text-xs">
                Secondary
              </div>
              <div className="h-8 bg-muted rounded flex items-center justify-center text-muted-foreground text-xs">
                Muted
              </div>
              <div className="h-8 bg-accent rounded flex items-center justify-center text-accent-foreground text-xs">
                Accent
              </div>
            </div>
          </CardContent>
        </Card>

        {/* UI Components */}
        <Card>
          <CardHeader>
            <CardTitle>UI Components</CardTitle>
            <CardDescription>Theme-aware components</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Button size="sm">Primary</Button>
              <Button size="sm" variant="outline">Outline</Button>
              <Button size="sm" variant="secondary">Secondary</Button>
            </div>
            <div className="flex gap-2">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Theme Features */}
      <Card>
        <CardHeader>
          <CardTitle>Theme Features</CardTitle>
          <CardDescription>What makes this theming system special</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-foreground">Automatic Detection</h4>
              <p className="text-sm text-muted-foreground">
                Automatically detects your system's color scheme preference and applies it on first visit.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-foreground">Persistent Storage</h4>
              <p className="text-sm text-muted-foreground">
                Your theme preference is saved in localStorage and will be remembered across sessions.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-foreground">Smooth Transitions</h4>
              <p className="text-sm text-muted-foreground">
                All color changes are animated with smooth transitions for a polished user experience.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-foreground">System Sync</h4>
              <p className="text-sm text-muted-foreground">
                Automatically updates when you change your system's color scheme (if no manual preference is set).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ThemeDemo;
