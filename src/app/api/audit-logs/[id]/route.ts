import { NextRequest, NextResponse } from 'next/server';
import { getAuditLogById } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const logId = parseInt(id, 10);
  
  if (isNaN(logId)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  const log = getAuditLogById(logId);
  
  if (!log) {
    return NextResponse.json({ error: 'Audit log not found' }, { status: 404 });
  }

  return NextResponse.json(log);
}
