import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  const username = getSessionUser();
  if (!username) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  }
  return NextResponse.json({ username });
}
