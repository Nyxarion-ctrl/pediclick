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

export default function TerminosPage() {
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
          Términos de uso
        </h1>
        <p className="mt-2 text-[12px]" style={{ color: C.inkFaint }}>
          Última actualización: {LAST_UPDATED}
        </p>

        <div
          className="mt-5 rounded-xl p-3.5 text-[12.5px] leading-relaxed"
          style={{ background: C.accentPale, borderLeft: `3px solid ${C.accent}`, color: C.accentDeep }}
        >
          En pocas palabras: PediClick es un directorio. Publicamos lo que los vendedores nos
          envían y ponemos el catálogo en línea; la compra, el pago y la entrega del producto
          ocurren directamente entre tú y el vendedor por WhatsApp. Nosotros no somos parte de esa
          transacción.
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 mt-8">
        <Section n={1} title="Qué es PediClick">
          <p>
            PediClick Directory ("PediClick", "nosotros") es un directorio digital donde
            vendedores independientes publican productos u ofertas para que compradores los
            encuentren y los contacten directamente por WhatsApp. No operamos una tienda, no
            procesamos pagos de productos, no manejamos inventario y no somos dueños de lo que se
            publica.
          </p>
        </Section>

        <Section n={2} title="Quién es responsable de cada producto">
          <p>
            Cada vendedor es el único responsable de la exactitud de su publicación (descripción,
            precio, fotos, disponibilidad), de cumplir con lo que ofrece y de cualquier garantía,
            devolución o reclamo relacionado con su producto.
          </p>
          <p>
            PediClick no verifica la identidad de los vendedores, ni la autenticidad, calidad o
            legalidad de los productos publicados, más allá de una revisión básica antes de
            aprobar una publicación. Recomendamos siempre confirmar detalles con el vendedor antes
            de acordar una compra.
          </p>
        </Section>

        <Section n={3} title="La compra ocurre fuera de PediClick">
          <p>
            Al hacer clic en "Escribir por WhatsApp", sales de PediClick y entras a una
            conversación directa con el vendedor. El acuerdo de compra, el método de pago, el
            envío o entrega, y cualquier disputa posterior, son exclusivamente entre comprador y
            vendedor. PediClick no media, no garantiza ni se hace responsable por esas
            transacciones.
          </p>
        </Section>

        <Section n={4} title="Publicar un producto">
          <p>
            Para publicar, un vendedor completa un formulario con sus datos y los del producto. La
            publicación puede quedar sujeta a revisión y aprobación antes de aparecer en el
            catálogo público. Nos reservamos el derecho de rechazar o retirar cualquier publicación
            que consideremos falsa, engañosa, ilegal, o que no cumpla con estos términos, sin
            necesidad de dar aviso previo.
          </p>
          <p>No está permitido publicar, entre otros: productos ilegales o falsificados, contenido que infrinja derechos de terceros, información de contacto falsa, o contenido engañoso sobre precio o características del producto.</p>
        </Section>

        <Section n={5} title="Suscripción y pagos a PediClick">
          <p>
            Publicar un producto como vendedor externo requiere una suscripción mensual, pagada
            directamente a PediClick (no al vendedor) por los métodos indicados en la app. El pago
            de la suscripción activa o mantiene visible la publicación en el catálogo; no es un
            pago por el producto en sí, ni PediClick recibe comisión sobre las ventas entre
            comprador y vendedor.
          </p>
          <p>
            La suscripción se renueva mensualmente. Si no se renueva, la publicación puede marcarse
            como vencida o retirarse del catálogo. Los pagos ya realizados no son reembolsables,
            salvo que la ley aplicable indique lo contrario.
          </p>
        </Section>

        <Section n={6} title="Cuentas y acceso de administrador">
          <p>
            El acceso administrativo del directorio está protegido por PIN y es de uso exclusivo
            del operador de PediClick. Eres responsable de mantener ese PIN en privado.
          </p>
        </Section>

        <Section n={7} title="Cambios a estos términos">
          <p>
            Podemos actualizar estos términos en cualquier momento. Los cambios entran en vigor
            desde que se publican en esta página. El uso continuado de PediClick después de un
            cambio implica que lo aceptas.
          </p>
        </Section>

        <Section n={8} title="Contacto">
          <p>
            ¿Preguntas sobre estos términos, sobre una publicación, o quieres reportar un
            problema? Escríbenos a {CONTACT_PLACEHOLDER}.
          </p>
        </Section>
      </main>
    </div>
  );
}
