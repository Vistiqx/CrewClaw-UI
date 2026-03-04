import Docker from "dockerode";

export interface HealthOverview {
  total: number;
  running: number;
  stopped: number;
  error: number;
  dockerVersion: string | null;
  lastUpdated: string;
  errorMessage?: string;
}

let docker: Docker | null = null;

export function getDocker(): Docker {
  if (!docker) {
    const socketPath = process.env.DOCKER_SOCKET || "/var/run/docker.sock";
    docker = new Docker({ socketPath });
  }
  return docker;
}
