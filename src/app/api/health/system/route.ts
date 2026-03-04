import { NextRequest, NextResponse } from "next/server";
import os from "os";
import fs from "fs";

export async function GET() {
  try {
    const cpuLoad = os.loadavg();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memPercent = (usedMem / totalMem) * 100;
    
    let diskUsage = 0;
    try {
      const stats = fs.statfsSync('/');
      const totalDisk = stats.bsize * stats.blocks;
      const freeDisk = stats.bsize * stats.bfree;
      diskUsage = ((totalDisk - freeDisk) / totalDisk) * 100;
    } catch {
      diskUsage = 0;
    }

    let temperature = null;
    try {
      const thermalPaths = [
        '/sys/class/thermal/thermal_zone0/temp',
        '/sys/class/hwmon/hwmon0/temp1_input',
      ];
      for (const path of thermalPaths) {
        if (fs.existsSync(path)) {
          const temp = parseInt(fs.readFileSync(path, 'utf-8'));
          temperature = temp / 1000;
          break;
        }
      }
    } catch {
      temperature = null;
    }

    const uptime = os.uptime();
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);

    const cpus = os.cpus();
    let idleTotal = 0;
    let totalTickTotal = 0;
    for (const cpu of cpus) {
      const times = cpu.times as Record<string, number>;
      for (const type in times) {
        totalTickTotal += times[type];
      }
      idleTotal += times.idle;
    }
    const cpuPercent = 100 - (idleTotal / totalTickTotal * 100);

    return NextResponse.json({
      cpu: {
        utilization: Math.round(cpuPercent * 10) / 10,
        load: cpuLoad.map(l => Math.round(l * 100) / 100),
        cores: cpus.length,
      },
      memory: {
        total: Math.round(totalMem / (1024 * 1024 * 1024) * 10) / 10,
        used: Math.round(usedMem / (1024 * 1024 * 1024) * 10) / 10,
        free: Math.round(freeMem / (1024 * 1024 * 1024) * 10) / 10,
        utilization: Math.round(memPercent * 10) / 10,
      },
      disk: {
        utilization: Math.round(diskUsage * 10) / 10,
      },
      temperature: temperature ? Math.round(temperature * 10) / 10 : null,
      uptime: {
        seconds: Math.round(uptime),
        formatted: `${days}d ${hours}h ${minutes}m`,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to get system metrics", details: String(error) },
      { status: 500 }
    );
  }
}
