import { NextRequest, NextResponse } from 'next/server';
import { getAuditLogs, getEventTypes } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const filters = {
    startDate: searchParams.get('startDate') || undefined,
    endDate: searchParams.get('endDate') || undefined,
    eventType: searchParams.get('eventType') || undefined,
    severity: searchParams.get('severity') || undefined,
    search: searchParams.get('search') || undefined,
    page: parseInt(searchParams.get('page') || '1', 10),
    limit: parseInt(searchParams.get('limit') || '50', 10),
  };

  const data = getAuditLogs(filters);
  const eventTypes = getEventTypes();

  return NextResponse.json({
    ...data,
    eventTypes,
  });
}
