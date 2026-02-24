import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EvidenceLegend } from "@/components/evidence-badge";
import { useMetrics } from "@/lib/metricsStore";
import { useTheme } from "@/components/theme-provider";
import {
  Database, Upload, Smartphone, Moon, Sun, FlaskConical, RefreshCw,
  Heart, Clock, Activity, Brain
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  const { showExperimental, setShowExperimental, resetData } = useMetrics();
  const { theme, toggleTheme } = useTheme();

  return (
    <ScrollArea className="h-full">
      <div className="p-4 md:p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-settings-title">Settings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Configure your dashboard and data sources</p>
        </div>

        <Card data-testid="card-data-sources">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-muted-foreground" />
              <CardTitle className="text-base">Data Sources</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-emerald-100 dark:bg-emerald-900/30">
                  <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">Mock Data</p>
                  <p className="text-xs text-muted-foreground">60 days of simulated metrics</p>
                </div>
              </div>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-0 no-default-active-elevate">
                Active
              </Badge>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-muted">
                  <Upload className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">CSV Import</p>
                  <p className="text-xs text-muted-foreground">Upload metrics from a CSV file</p>
                </div>
              </div>
              <Badge variant="outline" className="no-default-active-elevate">Coming Soon</Badge>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-muted">
                  <Upload className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">Manual Entry</p>
                  <p className="text-xs text-muted-foreground">Edit today's values from the Home page</p>
                </div>
              </div>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-0 no-default-active-elevate">
                Available
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-apple-health">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-muted-foreground" />
              <CardTitle className="text-base">Apple Health Integration</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md bg-muted/40 p-4">
              <p className="text-sm font-medium mb-2">Connect Apple Health (coming soon)</p>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                Apple Health integration will require an iOS/macOS native bridge (via Swift/HealthKit)
                or a local service that exports Apple Health data to JSON/CSV for this web dashboard.
              </p>
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Required fields:</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { icon: Heart, label: "HRV (Heart Rate Variability)" },
                    { icon: Clock, label: "Sleep Duration" },
                    { icon: Activity, label: "Resting Heart Rate" },
                    { icon: Brain, label: "VO2max" },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Icon className="w-3 h-3" />
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm" disabled data-testid="button-connect-health">
              <Smartphone className="w-4 h-4 mr-1.5" />
              Connect Apple Health
            </Button>
          </CardContent>
        </Card>

        <Card data-testid="card-preferences">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-muted">
                  {theme === "dark" ? (
                    <Moon className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <Sun className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">Dark Mode</p>
                  <p className="text-xs text-muted-foreground">Toggle between light and dark theme</p>
                </div>
              </div>
              <Switch
                checked={theme === "dark"}
                onCheckedChange={toggleTheme}
                data-testid="switch-dark-mode"
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-orange-100 dark:bg-orange-900/30">
                  <FlaskConical className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">Experimental Longevity Stack</p>
                  <p className="text-xs text-muted-foreground">Show NMN/NR, senolytics, and other experimental compounds</p>
                </div>
              </div>
              <Switch
                checked={showExperimental}
                onCheckedChange={setShowExperimental}
                data-testid="switch-experimental"
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-muted">
                  <RefreshCw className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">Reset Mock Data</p>
                  <p className="text-xs text-muted-foreground">Generate fresh 60-day simulated dataset</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={resetData} data-testid="button-reset-data">
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-evidence-legend">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Evidence Color Legend</CardTitle>
          </CardHeader>
          <CardContent>
            <EvidenceLegend />
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}
