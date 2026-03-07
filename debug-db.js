const Database = require("better-sqlite3");
const path = process.env.DB_PATH || "/opt/data/crewclaw-ui/CrewClaw-UI.db";

try {
  console.log("Connecting to:", path);
  const db = new Database(path);
  console.log("Connected");

  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log("\nTables:", tables.map(t => t.name).join(", "));

  console.log("\n--- Businesses ---");
  try {
    const businesses = db.prepare("SELECT * FROM businesses").all();
    console.log("Count:", businesses.length);
    businesses.slice(0, 3).forEach(b => console.log("  ", b.id, b.name));
  } catch(e) { console.log("Error:", e.message); }

  console.log("\n--- Assistants ---");
  try {
    const assistants = db.prepare("SELECT * FROM assistants").all();
    console.log("Count:", assistants.length);
    assistants.slice(0, 3).forEach(a => console.log("  ", a.id, a.name, "business:", a.business_id));
  } catch(e) { console.log("Error:", e.message); }

  console.log("\n--- Teams ---");
  try {
    const teams = db.prepare("SELECT * FROM teams").all();
    console.log("Count:", teams.length);
    teams.slice(0, 3).forEach(t => console.log("  ", t.id, t.name, "business:", t.business_id, "advisor:", t.primary_advisor_assistant_id));
  } catch(e) { console.log("Error:", e.message); }

  console.log("\n--- Team Members ---");
  try {
    const members = db.prepare("SELECT * FROM team_members").all();
    console.log("Count:", members.length);
    members.slice(0, 5).forEach(m => console.log("  team:", m.team_id, "assistant:", m.assistant_id));
  } catch(e) { console.log("Error:", e.message); }

  db.close();
} catch(e) {
  console.error("Fatal error:", e.message);
}
