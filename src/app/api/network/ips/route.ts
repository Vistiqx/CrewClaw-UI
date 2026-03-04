// src/app/api/network/ips/route.ts
import { NextRequest, NextResponse } from "next/server";
import { 
  getAllIps, 
  getAvailableIps, 
  getIpStatusSummary, 
  reserveIp, 
  assignIp, 
  autoAssignIp,
  getNextAvailableIp,
  isIpAvailable,
  isIpInRange
} from "@/lib/network";

// GET /api/network/ips - Get all IPs or summary
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    
    if (type === "summary") {
      const summary = getIpStatusSummary();
      return NextResponse.json(summary);
    }
    
    if (type === "available") {
      const ips = getAvailableIps();
      return NextResponse.json(ips);
    }
    
    if (type === "next") {
      const ip = getNextAvailableIp();
      if (!ip) {
        return NextResponse.json(
          { error: "No available IPs" },
          { status: 404 }
        );
      }
      return NextResponse.json({ ipAddress: ip });
    }
    
    // Return all IPs
    const ips = getAllIps();
    return NextResponse.json(ips);
  } catch (error) {
    console.error("Error fetching IPs:", error);
    return NextResponse.json(
      { error: "Failed to fetch IP addresses" },
      { status: 500 }
    );
  }
}

// POST /api/network/ips/reserve - Reserve an IP for an assistant
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { assistantId, ipAddress, auto } = body;
    
    if (!assistantId) {
      return NextResponse.json(
        { error: "Assistant ID is required" },
        { status: 400 }
      );
    }
    
    let assignedIp: string | null;
    
    if (auto) {
      // Auto-assign next available IP
      assignedIp = autoAssignIp(assistantId);
      if (!assignedIp) {
        return NextResponse.json(
          { error: "No available IPs for auto-assignment" },
          { status: 409 }
        );
      }
    } else if (ipAddress) {
      // Validate IP is available
      if (!isIpAvailable(ipAddress)) {
        return NextResponse.json(
          { error: "IP address is not available" },
          { status: 409 }
        );
      }
      
      // Validate IP is in range
      if (!isIpInRange(ipAddress)) {
        return NextResponse.json(
          { error: "IP address is outside the configured range" },
          { status: 400 }
        );
      }
      
      // Assign specific IP
      if (!assignIp(assistantId, ipAddress)) {
        return NextResponse.json(
          { error: "Failed to assign IP address" },
          { status: 500 }
        );
      }
      assignedIp = ipAddress;
    } else {
      return NextResponse.json(
        { error: "Either ipAddress or auto=true must be provided" },
        { status: 400 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      ipAddress: assignedIp,
      message: `IP ${assignedIp} assigned to assistant ${assistantId}`
    });
  } catch (error) {
    console.error("Error assigning IP:", error);
    return NextResponse.json(
      { error: "Failed to assign IP address" },
      { status: 500 }
    );
  }
}
