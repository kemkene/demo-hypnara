import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ message: 'Đã đăng xuất' });
  response.cookies.set('session', '', { path: '/', maxAge: 0 });
  return response;
}
