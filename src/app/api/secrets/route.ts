import { NextRequest, NextResponse } from "next/server";
import { getCredentials, getAllAssistants, addCredential, deleteCredential, updateCredential } from "@/lib/db";
import { encrypt } from "@/lib/encryption";

export async function GET() {
  try {
    const credentials = getCredentials();
    const assistants = getAllAssistants();
    
    const secretsWithDetails = credentials.map((cred) => {
      const assistant = assistants.find((a) => String(a.id) === String(cred.assistant_id));
      return {
        ...cred,
        assistant_name: assistant?.name || "Unknown",
        masked_value: "****-****",
      };
    });

    return NextResponse.json({ secrets: secretsWithDetails, assistants });
  } catch (error) {
    console.error("Error fetching secrets:", error);
    return NextResponse.json(
      { error: "Failed to fetch secrets" },
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
        { error: `Invalid secret type. Must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    const encryptedValue = encrypt(value);

    const secret = addCredential(assistant_id, type, name, encryptedValue);

    return NextResponse.json({
      id: secret.id,
      assistant_id: secret.assistant_id,
      type: secret.type,
      name: secret.name,
      masked_value: "****-****",
      created_at: secret.created_at,
    });
  } catch (error) {
    console.error("Error adding secret:", error);
    return NextResponse.json(
      { error: "Failed to add secret" },
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
        { error: "Secret not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting secret:", error);
    return NextResponse.json(
      { error: "Failed to delete secret" },
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
          { error: `Invalid secret type. Must be one of: ${validTypes.join(", ")}` },
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

    const secret = updateCredential(id, updates);

    if (!secret) {
      return NextResponse.json(
        { error: "Secret not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: secret.id,
      assistant_id: secret.assistant_id,
      type: secret.type,
      name: secret.name,
      masked_value: "****-****",
      updated_at: secret.updated_at,
    });
  } catch (error) {
    console.error("Error updating secret:", error);
    return NextResponse.json(
      { error: "Failed to update secret" },
      { status: 500 }
    );
  }
}
