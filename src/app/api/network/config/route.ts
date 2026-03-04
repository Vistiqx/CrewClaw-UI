// src/app/api/network/config/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getNetworkConfig, updateNetworkConfig, NetworkConfig } from "@/lib/network";

// GET /api/network/config - Get current network configuration
export async function GET() {
  try {
    const config = getNetworkConfig();
    
    if (!config) {
      return NextResponse.json(
        { error: "Network configuration not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(config);
  } catch (error) {
    console.error("Error fetching network config:", error);
    return NextResponse.json(
      { error: "Failed to fetch network configuration" },
      { status: 500 }
    );
  }
}

// PUT /api/network/config - Update network configuration
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ["parentInterface", "subnet", "gateway", "ipRangeStart", "ipRangeEnd"];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }
    
    // Validate IP addresses
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(body.ipRangeStart) || !ipRegex.test(body.ipRangeEnd)) {
      return NextResponse.json(
        { error: "Invalid IP address format" },
        { status: 400 }
      );
    }
    
    const config = updateNetworkConfig({
      parentInterface: body.parentInterface,
      subnet: body.subnet,
      gateway: body.gateway,
      ipRangeStart: body.ipRangeStart,
      ipRangeEnd: body.ipRangeEnd,
      networkName: body.networkName,
    });
    
    if (!config) {
      return NextResponse.json(
        { error: "Failed to update network configuration" },
        { status: 500 }
      );
    }
    
    return NextResponse.json(config);
  } catch (error) {
    console.error("Error updating network config:", error);
    return NextResponse.json(
      { error: "Failed to update network configuration" },
      { status: 500 }
    );
  }
}
