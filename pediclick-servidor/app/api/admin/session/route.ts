import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isValidSessionCookieValue, ADMIN_COOKIE_NAME } from "@/lib/adminAuth";

export async function GET() {
  const cookieStore = await cookies();
  const isAdmin = isValidSessionCookieValue(cookieStore.get(ADMIN_COOKIE_NAME)?.value);
  return NextResponse.json({ isAdmin });
}
