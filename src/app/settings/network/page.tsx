// src/app/settings/network/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Alert, AlertDescription } from "@/components/ui/Alert";
import {
  Network,
  RefreshCw,
  Wifi,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface NetworkConfig {
  id: number;
  parentInterface: string;
  subnet: string;
  gateway: string;
  ipRangeStart: string;
  ipRangeEnd: string;
  networkName: string;
  updatedAt: string;
}

interface IpStatus {
  total: number;
  available: number;
  assigned: number;
  reserved: number;
  released: number;
}

export default function NetworkSettingsPage() {
  const [config, setConfig] = useState<NetworkConfig | null>(null);
  const [ipStatus, setIpStatus] = useState<IpStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      setRefreshing(true);

      // Fetch network config
      const configRes = await fetch("/api/network/config");
      if (!configRes.ok) throw new Error("Failed to fetch network config");
      const configData = await configRes.json();
      setConfig(configData);

      // Fetch IP status
      const statusRes = await fetch("/api/network/ips?type=summary");
      if (!statusRes.ok) throw new Error("Failed to fetch IP status");
      const statusData = await statusRes.json();
      setIpStatus(statusData);

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Network Settings</h1>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw
            className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* MACVLAN Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="w-5 h-5" />
            MACVLAN Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {config ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Parent Interface
                </label>
                <p className="text-lg font-semibold">{config.parentInterface}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Network Name
                </label>
                <p className="text-lg font-semibold">{config.networkName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Subnet
                </label>
                <p className="text-lg font-semibold">{config.subnet}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Gateway
                </label>
                <p className="text-lg font-semibold">{config.gateway}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  IP Range Start
                </label>
                <p className="text-lg font-semibold">{config.ipRangeStart}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  IP Range End
                </label>
                <p className="text-lg font-semibold">{config.ipRangeEnd}</p>
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Last Updated
                </label>
                <p className="text-sm">
                  {new Date(config.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Network configuration not found. Run setup script to configure.
            </div>
          )}
        </CardContent>
      </Card>

      {/* IP Pool Status */}
      {ipStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="w-5 h-5" />
              IP Pool Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-3xl font-bold">{ipStatus.total}</p>
                <p className="text-sm text-muted-foreground mt-1">Total IPs</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-3xl font-bold text-green-600">
                  {ipStatus.available}
                </p>
                <p className="text-sm text-green-600 mt-1">Available</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-3xl font-bold text-blue-600">
                  {ipStatus.assigned}
                </p>
                <p className="text-sm text-blue-600 mt-1">Assigned</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <p className="text-3xl font-bold text-yellow-600">
                  {ipStatus.reserved}
                </p>
                <p className="text-sm text-yellow-600 mt-1">Reserved</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-3xl font-bold text-gray-600">
                  {ipStatus.released}
                </p>
                <p className="text-sm text-gray-600 mt-1">Released</p>
              </div>
            </div>

            {/* Usage Bar */}
            <div className="mt-6">
              <div className="flex justify-between text-sm mb-2">
                <span>IP Usage</span>
                <span>
                  {Math.round(
                    ((ipStatus.assigned + ipStatus.reserved) / ipStatus.total) *
                      100
                  )}
                  %
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${
                      ((ipStatus.assigned + ipStatus.reserved) / ipStatus.total) *
                      100
                    }%`,
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Status */}
      <Card>
        <CardHeader>
          <CardTitle>Security Enforcement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium">Docker AuthZ Plugin</p>
                  <p className="text-sm text-muted-foreground">
                    Active and enforcing security policies
                  </p>
                </div>
              </div>
              <Badge variant="default">Active</Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <XCircle className="w-5 h-5 text-red-500" />
                <div>
                  <p className="font-medium">Privileged Containers</p>
                  <p className="text-sm text-muted-foreground">
                    Strictly denied for all containers
                  </p>
                </div>
              </div>
              <Badge variant="destructive">Denied</Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="font-medium">MACVLAN Network</p>
                  <p className="text-sm text-muted-foreground">
                    Required for all assistant containers
                  </p>
                </div>
              </div>
              <Badge>Required</Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="font-medium">Container Naming</p>
                  <p className="text-sm text-muted-foreground">
                    Pattern: XXX-name (3-char prefix required)
                  </p>
                </div>
              </div>
              <Badge>Enforced</Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="font-medium">Volume Restrictions</p>
                  <p className="text-sm text-muted-foreground">
                    Only /opt/data/crewclaw-assistants/ allowed
                  </p>
                </div>
              </div>
              <Badge>Restricted</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
