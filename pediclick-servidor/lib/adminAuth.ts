import { createHmac, timingSafeEqual } from "crypto";

export const ADMIN_COOKIE_NAME = "pediclick_admin";

const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET!;

function sign(value: string): string {
  return createHmac("sha256", SESSION_SECRET).update(value).digest("hex");
}

// Crea el valor de la cookie de sesión: "admin.<timestamp>.<firma>"
export function createSessionCookieValue(): string {
  const payload = `admin.${Date.now()}`;
  return `${payload}.${sign(payload)}`;
}

// Verifica que la cookie no haya sido falsificada (comparación a tiempo constante)
export function isValidSessionCookieValue(cookieValue: string | undefined | null): boolean {
  if (!cookieValue) return false;
  const lastDot = cookieValue.lastIndexOf(".");
  if (lastDot === -1) return false;

  const payload = cookieValue.slice(0, lastDot);
  const signature = cookieValue.slice(lastDot + 1);
  const expected = sign(payload);

  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

// El PIN nunca se guarda en texto plano — se guarda su hash
export function hashPin(pin: string): string {
  return createHmac("sha256", SESSION_SECRET).update(pin).digest("hex");
}
