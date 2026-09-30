"use client";

import React, { useId } from "react";
import { Fraunces, Archivo } from "next/font/google";
import { ArrowLeft } from "lucide-react";

/* Mismo sistema de diseño que /page.tsx — ver ese archivo para el detalle del concepto. */
const C = {
  paper: "#FFFFFF",
  paperSoft: "#F6F7F6",
  surface: "#FFFFFF",
  ink: "#15171A",
  inkSoft: "#5B6066",
  inkFaint: "#8E9298",
  line: "#E6E8E5",
  lineStrong: "#D3D6D1",
  accent: "#14A76C",
  accentDeep: "#0F8A58",
  accentPale: "#E1F5EA",
  trust: "#2F6FED",
  trustPale: "#E5EDFE",
  highlight: "#D98C1D",
  highlightPale: "#FBEBD3",
  offer: "#DC4B3F",
  offerPale: "#FBE4E1",
};

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600", "700", "900"],
  variable: "--font-display",
  display: "swap",
});

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

// TODO: reemplaza esto por tu correo o WhatsApp de contacto real.
const CONTACT_PLACEHOLDER = "[correo de contacto]";
const LAST_UPDATED = "29 de septiembre de 2026";

function Mark({ size = 34 }: { size?: number }) {
  const gradId = `pc-mark-${useId()}`;
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true" style={{ filter: "drop-shadow(0 3px 6px rgba(15,138,88,0.30))" }}>
      <defs>
        <linearGradient id={gradId} x1="3" y1="2" x2="29" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={C.accentDeep} />
          <stop offset="1" stopColor={C.accent} />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="30" height="30" rx="9" fill={`url(#${gradId})`} />
      <rect x="1.6" y="1.6" width="28.8" height="28.8" rx="8.4" stroke="#FFFFFF" strokeOpacity="0.16" />
      <rect x="11" y="8" width="4" height="17" rx="2" fill="#FFFFFF" />
      <circle cx="18.6" cy="12.6" r="5.4" fill="#FFFFFF" />
      <circle cx="18.6" cy="12.6" r="2.3" fill="none" stroke={C.accentDeep} strokeOpacity="0.45" strokeWidth="1" />
    </svg>
  );
}

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="pt-6 mt-6 border-t first:mt-0 first:pt-0 first:border-t-0" style={{ borderColor: C.line }}>
      <h2 className="text-[15px] font-bold flex items-baseline gap-2">
        <span style={{ color: C.accent }}>{String(n).padStart(2, "0")}</span>
        {title}
      </h2>
      <div className="mt-2 text-[13.5px] leading-relaxed space-y-2.5" style={{ color: C.inkSoft }}>
        {children}
      </div>
    </section>
  );
}

function DataRow({ label, detail }: { label: string; detail: string }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b last:border-b-0" style={{ borderColor: C.line }}>
      <span className="text-[12.5px] font-semibold w-32 sm:w-40 shrink-0" style={{ color: C.ink }}>
        {label}
      </span>
      <span className="text-[12.5px]" style={{ color: C.inkSoft }}>
        {detail}
      </span>
    </div>
  );
}

export default function PrivacidadPage() {
  return (
    <div
      className={`${fraunces.variable} ${archivo.variable} min-h-screen pb-20`}
      style={{ background: C.paper, color: C.ink, fontFamily: "var(--font-body)" }}
    >
      <header className="max-w-2xl mx-auto px-5 pt-10 sm:pt-14">
        <a
          href="/"
          className="inline-flex items-center gap-1.5 text-[12px] font-semibold transition-opacity hover:opacity-70"
          style={{ color: C.inkSoft }}
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Volver al directorio
        </a>

        <div className="flex items-center gap-3 mt-6">
          <Mark />
          <div className="leading-none">
            <div className="text-[18px] font-semibold" style={{ fontFamily: "var(--font-display)" }}>
              PediClick
            </div>
            <div className="text-[11px] mt-0.5" style={{ color: C.inkFaint }}>
              Directorio de vendedores
            </div>
          </div>
        </div>

        <h1 className="mt-8 text-[30px] sm:text-[36px] leading-[1.1] font-extrabold tracking-tight">
          Política de privacidad
        </h1>
        <p className="mt-2 text-[12px]" style={{ color: C.inkFaint }}>
          Última actualización: {LAST_UPDATED}
        </p>

        <div
          className="mt-5 rounded-xl p-3.5 text-[12.5px] leading-relaxed"
          style={{ background: C.accentPale, borderLeft: `3px solid ${C.accent}`, color: C.accentDeep }}
        >
          En pocas palabras: solo guardamos los datos necesarios para mostrar tu producto en el
          catálogo (nombre, WhatsApp, categoría, precio, foto opcional). No vendemos tus datos a
          terceros ni los usamos para nada fuera de operar el directorio.
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 mt-8">
        <Section n={1} title="Qué datos recopilamos">
          <p>Cuando publicas un producto como vendedor, recopilamos:</p>
          <div className="mt-1 rounded-xl border overflow-hidden" style={{ borderColor: C.line }}>
            <div className="px-3.5">
              <DataRow label="Nombre del producto" detail="Se muestra públicamente en el catálogo." />
              <DataRow label="Tu número de WhatsApp" detail="Se usa para generar el enlace de contacto directo con el comprador." />
              <DataRow label="Categoría, precio, descripción" detail="Información que tú decides incluir sobre el producto." />
              <DataRow label="Foto del producto" detail="Opcional — subida desde tu dispositivo o por link. Si no la subes, generamos un ícono con la inicial del producto." />
            </div>
          </div>
          <p className="mt-2">
            Cuando navegas el catálogo como comprador, no te pedimos ningún dato personal — solo al
            hacer clic en "Escribir por WhatsApp" te llevamos a una conversación directa con el
            vendedor, fuera de PediClick.
          </p>
        </Section>

        <Section n={2} title="Para qué usamos tus datos">
          <p>
            Usamos los datos únicamente para mostrar tu publicación en el catálogo público y
            generar el enlace de contacto por WhatsApp. No los usamos para enviarte publicidad, no
            los compartimos con anunciantes, y no los vendemos a terceros bajo ninguna
            circunstancia.
          </p>
        </Section>

        <Section n={3} title="Dónde se guardan tus datos">
          <p>
            Los datos de productos se almacenan en nuestra base de datos (Supabase). Si subes una
            foto desde tu dispositivo, se procesa y comprime en tu propio navegador antes de
            guardarse — no pasa por servidores externos de imágenes.
          </p>
        </Section>

        <Section n={4} title="Comprobantes de pago">
          <p>
            Si pagas la suscripción por Lemon Squeezy o PayPal, ese pago lo procesa directamente
            esa plataforma bajo su propia política de privacidad — PediClick no almacena números de
            tarjeta ni datos bancarios completos. Si envías un comprobante de pago por WhatsApp,
            queda en esa conversación, no en nuestra base de datos.
          </p>
        </Section>

        <Section n={5} title="Cuánto tiempo conservamos tus datos">
          <p>
            Mantenemos los datos de tu publicación mientras esté activa o pendiente de aprobación.
            Si eliminas tu publicación o dejas de renovar la suscripción por un período prolongado,
            podemos eliminar los datos asociados de nuestra base de datos.
          </p>
        </Section>

        <Section n={6} title="Tus derechos sobre tus datos">
          <p>
            Puedes pedirnos en cualquier momento que corrijamos o eliminemos los datos de tu
            publicación escribiéndonos a {CONTACT_PLACEHOLDER}. Si eres administrador, también
            puedes editar o eliminar publicaciones directamente desde el panel de administrador.
          </p>
        </Section>

        <Section n={7} title="Cambios a esta política">
          <p>
            Podemos actualizar esta política ocasionalmente. Los cambios entran en vigor desde que
            se publican en esta página.
          </p>
        </Section>

        <Section n={8} title="Contacto">
          <p>
            ¿Preguntas sobre tus datos o esta política? Escríbenos a {CONTACT_PLACEHOLDER}.
          </p>
        </Section>
      </main>
    </div>
  );
}
