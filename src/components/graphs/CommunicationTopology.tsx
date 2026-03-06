"use client";

import { Network, Users, Bot, User, ArrowRight, ArrowLeft, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

interface CommunicationTopologyProps {
  ownerId?: string;
  councils?: { id: string; name: string }[];
  teams?: { id: string; name: string }[];
  assistants?: { id: string; name: string; type?: 'advisor' | 'orchestrator' | 'worker' }[];
  allowedEdges?: { from: string; to: string }[];
  blockedEdges?: { from: string; to: string; reason?: string }[];
}

export function CommunicationTopology({
  ownerId = 'owner',
  councils = [],
  teams = [],
  assistants = [],
  allowedEdges = [],
  blockedEdges = [],
}: CommunicationTopologyProps) {
  const nodes = [
    { id: ownerId, name: 'Human Owner', type: 'owner', icon: User },
    ...councils.map(c => ({ ...c, type: 'council', icon: Users })),
    ...teams.map(t => ({ ...t, type: 'team', icon: Network })),
    ...assistants.map(a => ({ ...a, type: a.type || 'worker', icon: Bot })),
  ];

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'owner': return 'bg-[var(--tropical-indigo)]';
      case 'council': return 'bg-[var(--amethyst)]';
      case 'team': return 'bg-[var(--ultra-violet)]';
      case 'advisor': return 'bg-[var(--success)]';
      case 'orchestrator': return 'bg-[var(--warning)]';
      default: return 'bg-[var(--dim-gray)]';
    }
  };

  return (
    <Card className="bg-[var(--night-light)] border-[var(--border)]">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Network className="h-5 w-5 text-[var(--tropical-indigo)]" />
          <CardTitle className="text-base">Communication Topology</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {nodes.map((node) => {
              const Icon = node.icon;
              return (
                <div
                  key={node.id}
                  className="flex items-center gap-2 p-2 rounded-lg bg-[var(--night-lighter)] border border-[var(--border)]"
                >
                  <div className={`h-8 w-8 rounded-full ${getNodeColor(node.type)} flex items-center justify-center`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-[var(--lavender)] truncate">{node.name}</p>
                    <p className="text-[10px] text-[var(--lavender-muted)] capitalize">{node.type}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {(allowedEdges.length > 0 || blockedEdges.length > 0) && (
            <div className="pt-4 border-t border-[var(--border)]">
              <h4 className="text-sm font-medium text-[var(--lavender)] mb-3">Communication Rules</h4>
              
              {allowedEdges.length > 0 && (
                <div className="space-y-1 mb-3">
                  <p className="text-xs text-[var(--success)] mb-2">Allowed Communications</p>
                  {allowedEdges.map((edge, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <span className="text-[var(--lavender)]">{edge.from}</span>
                      <ArrowRight className="h-3 w-3 text-[var(--success)]" />
                      <span className="text-[var(--lavender)]">{edge.to}</span>
                    </div>
                  ))}
                </div>
              )}

              {blockedEdges.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-[var(--error)] mb-2">Blocked Communications</p>
                  {blockedEdges.map((edge, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <span className="text-[var(--lavender)]">{edge.from}</span>
                      <X className="h-3 w-3 text-[var(--error)]" />
                      <span className="text-[var(--lavender)]">{edge.to}</span>
                      {edge.reason && (
                        <span className="text-xs text-[var(--lavender-muted)]">({edge.reason})</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
