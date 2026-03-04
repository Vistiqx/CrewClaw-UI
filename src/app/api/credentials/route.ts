import { NextRequest, NextResponse } from "next/server";
import { getCredentials, getAllAssistants, addCredential, deleteCredential, updateCredential } from "@/lib/db";
import { encrypt } from "@/lib/encryption";

export async function GET() {
  try {
    const credentials = getCredentials();
    const assistants = getAllAssistants();
    
    const credentialsWithDetails = credentials.map((cred) => {
      const assistant = assistants.find((a) => String(a.id) === String(cred.assistant_id));
      return {
        ...cred,
        assistant_name: assistant?.name || "Unknown",
        masked_value: "****-****",
      };
    });

    return NextResponse.json({ credentials: credentialsWithDetails, assistants });
  } catch (error) {
    console.error("Error fetching credentials:", error);
    return NextResponse.json(
      { error: "Failed to fetch credentials" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { assistant_id, type, name, value } = body;

    if (!assistant_id || !type || !name || !value) {
      return NextResponse.json(
        { error: "Missing required fields: assistant_id, type, name, value" },
        { status: 400 }
      );
    }

    const validTypes = [
      "openrouter_api_key", 
      "openai_api_key", 
      "anthropic_api_key", 
      "telegram_bot_token", 
      "slack_bot_token", 
      "discord_bot_token", 
      "signal_token", 
      "api_key", 
      "other"
    ];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid credential type. Must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    const encryptedValue = encrypt(value);

    const credential = addCredential(assistant_id, type, name, encryptedValue);

    return NextResponse.json({
      id: credential.id,
      assistant_id: credential.assistant_id,
      type: credential.type,
      name: credential.name,
      masked_value: "****-****",
      created_at: credential.created_at,
    });
  } catch (error) {
    console.error("Error adding credential:", error);
    return NextResponse.json(
      { error: "Failed to add credential" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Missing required field: id" },
        { status: 400 }
      );
    }

    const deleted = deleteCredential(id);

    if (!deleted) {
      return NextResponse.json(
        { error: "Credential not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting credential:", error);
    return NextResponse.json(
      { error: "Failed to delete credential" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, assistant_id, type, name, value } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Missing required field: id" },
        { status: 400 }
      );
    }

    const updates: { assistant_id?: number; type?: string; name?: string; value?: Buffer } = {};

    if (assistant_id !== undefined) {
      updates.assistant_id = parseInt(String(assistant_id));
    }
    if (type !== undefined) {
      const validTypes = [
        "openrouter_api_key", 
        "openai_api_key", 
        "anthropic_api_key", 
        "telegram_bot_token", 
        "slack_bot_token", 
        "discord_bot_token", 
        "signal_token", 
        "api_key", 
        "other"
      ];
      if (!validTypes.includes(type)) {
        return NextResponse.json(
          { error: `Invalid credential type. Must be one of: ${validTypes.join(", ")}` },
          { status: 400 }
        );
      }
      updates.type = type;
    }
    if (name !== undefined) {
      updates.name = name;
    }
    if (value !== undefined && value !== "") {
      updates.value = encrypt(value);
    }

    const credential = updateCredential(id, updates);

    if (!credential) {
      return NextResponse.json(
        { error: "Credential not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: credential.id,
      assistant_id: credential.assistant_id,
      type: credential.type,
      name: credential.name,
      masked_value: "****-****",
      updated_at: credential.updated_at,
    });
  } catch (error) {
    console.error("Error updating credential:", error);
    return NextResponse.json(
      { error: "Failed to update credential" },
      { status: 500 }
    );
  }
}
