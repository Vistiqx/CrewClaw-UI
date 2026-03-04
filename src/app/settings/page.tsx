"use client";

import { useState, useEffect } from "react";
import { Settings, Database, Shield, Bell, Moon, Sun } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { Badge } from "@/components/ui/Badge";

interface AppSettings {
  theme: "dark" | "light";
  notifications: boolean;
  autoRefresh: boolean;
  refreshInterval: number;
  logRetention: number;
  sessionTimeout: number;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>({
    theme: "dark",
    notifications: true,
    autoRefresh: true,
    refreshInterval: 30,
    logRetention: 30,
    sessionTimeout: 60,
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load settings from localStorage or API
    const savedSettings = localStorage.getItem("crewclaw-settings");
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const handleSave = async () => {
    setLoading(true);
    // Save to localStorage for now (can be extended to API)
    localStorage.setItem("crewclaw-settings", JSON.stringify(settings));
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    if (confirm("Are you sure you want to reset all settings to default?")) {
      setSettings({
        theme: "dark",
        notifications: true,
        autoRefresh: true,
        refreshInterval: 30,
        logRetention: 30,
        sessionTimeout: 60,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="w-8 h-8 text-[var(--tropical-indigo)]" />
        <h1 className="text-3xl font-bold text-[var(--lavender)]">Settings</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Appearance Settings */}
        <Card className="bg-night-light border-border">
          <CardHeader>
            <CardTitle className="text-lavender flex items-center gap-2">
              {settings.theme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--lavender)]">Dark Mode</p>
                <p className="text-xs text-[var(--lavender-muted)]">Use dark theme throughout the application</p>
              </div>
              <Switch
                checked={settings.theme === "dark"}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, theme: checked ? "dark" : "light" })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Notifications Settings */}
        <Card className="bg-night-light border-border">
          <CardHeader>
            <CardTitle className="text-lavender flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--lavender)]">Enable Notifications</p>
                <p className="text-xs text-[var(--lavender-muted)]">Receive alerts for important events</p>
              </div>
              <Switch
                checked={settings.notifications}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, notifications: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Auto Refresh Settings */}
        <Card className="bg-night-light border-border">
          <CardHeader>
            <CardTitle className="text-lavender flex items-center gap-2">
              <Database className="h-5 w-5" />
              Data Refresh
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--lavender)]">Auto Refresh</p>
                <p className="text-xs text-[var(--lavender-muted)]">Automatically refresh dashboard data</p>
              </div>
              <Switch
                checked={settings.autoRefresh}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, autoRefresh: checked })
                }
              />
            </div>
            {settings.autoRefresh && (
              <div className="pt-2 border-t border-[var(--border)]">
                <label className="text-sm text-[var(--lavender-muted)]">Refresh Interval (seconds)</label>
                <div className="flex gap-2 mt-2">
                  {[10, 30, 60, 300].map((interval) => (
                    <Button
                      key={interval}
                      variant={settings.refreshInterval === interval ? "primary" : "secondary"}
                      size="sm"
                      onClick={() => setSettings({ ...settings, refreshInterval: interval })}
                    >
                      {interval < 60 ? `${interval}s` : `${interval / 60}m`}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="bg-night-light border-border">
          <CardHeader>
            <CardTitle className="text-lavender flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-[var(--lavender-muted)]">Session Timeout (minutes)</label>
              <div className="flex gap-2 mt-2">
                {[15, 30, 60, 120].map((timeout) => (
                  <Button
                    key={timeout}
                    variant={settings.sessionTimeout === timeout ? "primary" : "secondary"}
                    size="sm"
                    onClick={() => setSettings({ ...settings, sessionTimeout: timeout })}
                  >
                    {timeout < 60 ? `${timeout}m` : `${timeout / 60}h`}
                  </Button>
                ))}
              </div>
            </div>
            <div className="pt-2 border-t border-[var(--border)]">
              <label className="text-sm text-[var(--lavender-muted)]">Log Retention (days)</label>
              <div className="flex gap-2 mt-2">
                {[7, 30, 90, 365].map((days) => (
                  <Button
                    key={days}
                    variant={settings.logRetention === days ? "primary" : "secondary"}
                    size="sm"
                    onClick={() => setSettings({ ...settings, logRetention: days })}
                  >
                    {days}d
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Information */}
      <Card className="bg-night-light border-border">
        <CardHeader>
          <CardTitle className="text-lavender">System Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-[var(--lavender-muted)]">Version</p>
              <p className="text-[var(--lavender)] font-medium">0.1.0</p>
            </div>
            <div>
              <p className="text-[var(--lavender-muted)]">Environment</p>
              <Badge variant="secondary">Production</Badge>
            </div>
            <div>
              <p className="text-[var(--lavender-muted)]">Database</p>
              <p className="text-[var(--lavender)] font-medium">SQLite</p>
            </div>
            <div>
              <p className="text-[var(--lavender-muted)]">Node.js</p>
              <p className="text-[var(--lavender)] font-medium">v20.x</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        <Button variant="secondary" onClick={handleReset}>
          Reset to Default
        </Button>
        <Button onClick={handleSave} disabled={loading}>
          {loading ? "Saving..." : saved ? "Saved!" : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}
