import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getDb, Business } from "@/lib/db";

const registryPath = path.join(process.cwd(), "data", "business-registry.json");

interface RegistryBusiness {
  id: string;
  name: string;
  prefix: string;
  industry: string;
  description: string;
  timezone: string;
  status: string;
  created_at: string;
  updated_at: string;
}

function getRegistryBusinesses(): RegistryBusiness[] {
  const data = fs.readFileSync(registryPath, "utf-8");
  return JSON.parse(data);
}

function isRegistryBusiness(id: string): boolean {
  const registryBusinesses = getRegistryBusinesses();
  return registryBusinesses.some((b: RegistryBusiness) => b.id === id);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  
  const business = db.prepare("SELECT * FROM businesses WHERE id = ?").get(id) as Business | undefined;
  
  if (business) {
    return NextResponse.json(business);
  }
  
  const registryBusinesses = getRegistryBusinesses();
  const registryBusiness = registryBusinesses.find((b: RegistryBusiness) => b.id === id);
  
  if (registryBusiness) {
    return NextResponse.json(registryBusiness);
  }
  
  return NextResponse.json({ error: "Business not found" }, { status: 404 });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  const body = await request.json();
  
  // Check if business exists in database
  let existing = db.prepare("SELECT * FROM businesses WHERE id = ?").get(id) as Business | undefined;
  
  // If not in database, check if it's a registry business and migrate it
  if (!existing) {
    const registryBusinesses = getRegistryBusinesses();
    const registryBusiness = registryBusinesses.find((b: RegistryBusiness) => b.id === id);
    
    if (registryBusiness) {
      // Migrate registry business to database
      db.prepare(
        `INSERT INTO businesses (id, name, prefix, industry, description, timezone, status, business_type, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        registryBusiness.id,
        registryBusiness.name,
        registryBusiness.prefix,
        registryBusiness.industry,
        registryBusiness.description,
        registryBusiness.timezone,
        registryBusiness.status,
        'primary', // Default business type for registry businesses
        registryBusiness.created_at,
        new Date().toISOString()
      );
      
      // Fetch the newly migrated business
      existing = db.prepare("SELECT * FROM businesses WHERE id = ?").get(id) as Business;
    } else {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }
  }
  
  const updates: string[] = [];
  const values: (string | null)[] = [];
  
  if (body.name !== undefined) {
    updates.push("name = ?");
    values.push(body.name);
  }
  if (body.prefix !== undefined) {
    updates.push("prefix = ?");
    values.push(body.prefix);
  }
  if (body.industry !== undefined) {
    updates.push("industry = ?");
    values.push(body.industry);
  }
  if (body.description !== undefined) {
    updates.push("description = ?");
    values.push(body.description);
  }
  if (body.timezone !== undefined) {
    updates.push("timezone = ?");
    values.push(body.timezone);
  }
  if (body.status !== undefined) {
    updates.push("status = ?");
    values.push(body.status);
  }
  
  updates.push("updated_at = ?");
  values.push(new Date().toISOString());
  
  values.push(id);
  
  db.prepare(`UPDATE businesses SET ${updates.join(", ")} WHERE id = ?`).run(...values);
  
  const updated = db.prepare("SELECT * FROM businesses WHERE id = ?").get(id);
  
  return NextResponse.json(updated);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  const db = getDb();
  
  // Check if business exists in database
  const existingDb = db.prepare("SELECT * FROM businesses WHERE id = ?").get(id);
  
  // Check if it's a registry business
  const isRegistry = isRegistryBusiness(id);
  
  if (!existingDb && !isRegistry) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }
  
  // Delete from database if exists
  if (existingDb) {
    db.prepare("DELETE FROM businesses WHERE id = ?").run(id);
  }
  
  // If it's a registry business, remove from registry file
  if (isRegistry) {
    try {
      const registryBusinesses = getRegistryBusinesses();
      const updatedRegistry = registryBusinesses.filter((b: RegistryBusiness) => b.id !== id);
      
      // Write updated registry back to file
      fs.writeFileSync(registryPath, JSON.stringify(updatedRegistry, null, 2));
      
      return NextResponse.json({ 
        success: true, 
        message: "Registry business deleted successfully" 
      });
    } catch (error) {
      console.error("Error updating registry file:", error);
      return NextResponse.json(
        { error: "Failed to update registry file" },
        { status: 500 }
      );
    }
  }
  
  return NextResponse.json({ success: true });
}
