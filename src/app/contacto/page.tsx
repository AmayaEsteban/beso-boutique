import { prisma } from "@/lib/prisma";
import ContactForm from "@/components/ui/contact-form"; // ← IMPORTA EL FORM

export const metadata = {
  title: "Contáctanos | BESO Boutique",
  description:
    "Comunícate con BESO Boutique: teléfono, WhatsApp, correo, redes sociales, horarios y ubicación.",
};

// ==== Iconos (SVG, heredan currentColor para light/dark) ====
function PhoneIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden {...props}>
      <path
        d="M4 5c0-1.1.9-2 2-2h1.2c.5 0 .9.3 1.1.7l1.2 2.6c.2.4.1.9-.2 1.2L8.2 9.4c1 2 2.6 3.6 4.6 4.6l1.9-1.1c.4-.3.9-.3 1.3-.1l2.6 1.2c.4.2.7.6.7 1.1V18c0 1.1-.9 2-2 2h-.5C10.5 20 4 13.5 4.1 6.5V5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function WhatsIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden {...props}>
      <path
        d="M3 20l1.4-4.3A8 8 0 1012 20a8.3 8.3 0 01-3.9-1L3 20z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M8.5 8.7c.3-1 .7-1 1.2-.8.5.2 1.2 1.5 1.3 1.7.1.2 0 .5-.2.7l-.4.4c.5 1 1.5 1.9 2.6 2.4l.5-.5c.2-.2.5-.3.7-.2.2.1 1.4.8 1.6 1.3.2.5.2.9-.8 1.2-1.1.4-3.1.2-5.2-1.8s-2.2-4-1.9-4.4z"
        fill="currentColor"
      />
    </svg>
  );
}
function MailIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden {...props}>
      <rect
        x="3.5"
        y="5"
        width="17"
        height="14"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M4.5 7l7.4 5.5a1 1 0 001.2 0L20.5 7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
function ShareIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden {...props}>
      <circle
        cx="18"
        cy="5"
        r="2.5"
        stroke="currentColor"
        strokeWidth="1.6"
        fill="none"
      />
      <circle
        cx="6"
        cy="12"
        r="2.5"
        stroke="currentColor"
        strokeWidth="1.6"
        fill="none"
      />
      <circle
        cx="18"
        cy="19"
        r="2.5"
        stroke="currentColor"
        strokeWidth="1.6"
        fill="none"
      />
      <path d="M8 11l8-5M8 13l8 5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
function MapPinIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden {...props}>
      <path
        d="M12 22s7-6.1 7-12a7 7 0 10-14 0c0 5.9 7 12 7 12z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle cx="12" cy="10" r="2.5" fill="currentColor" />
    </svg>
  );
}
function ClockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden {...props}>
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M12 7v5l3 2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ==== Página (Server Component, lee Prisma directamente) ====
export default async function ContactoPage() {
  const data = await prisma.contacto.findUnique({ where: { id: 1 } });

  const telHref =
    data?.telefono?.replace(/\s+/g, "")?.replace(/[^\d+]/g, "") ?? null;
  const waHref =
    data?.whatsapp?.replace(/\s+/g, "")?.replace(/[^\d+]/g, "") ?? null;

  return (
    <section
      className="container"
      style={{ maxWidth: 1040, padding: "2rem 1rem" }}
    >
      <header className="mb-6">
        <h1 className="text-3xl font-bold">Contáctanos</h1>
        <p className="muted mt-2">
          Resolvemos tus dudas sobre productos, envíos y cambios.
        </p>
      </header>

      {/* Tarjetas de contacto */}
      <div
        className="grid gap-6 mb-6"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}
      >
        {/* Teléfono */}
        {data?.telefono && (
          <article className="panel p-5">
            <div className="flex items-center gap-2 mb-1">
              <PhoneIcon />
              <h3 className="font-bold">Teléfono</h3>
            </div>
            <p>
              <a className="link" href={`tel:${telHref}`}>
                {data.telefono}
              </a>
            </p>
            {data?.horario && (
              <p className="muted text-sm flex items-center gap-1 mt-1">
                <ClockIcon /> {data.horario}
              </p>
            )}
          </article>
        )}

        {/* WhatsApp */}
        {data?.whatsapp && (
          <article className="panel p-5">
            <div className="flex items-center gap-2 mb-1">
              <WhatsIcon />
              <h3 className="font-bold">WhatsApp</h3>
            </div>
            <p>
              <a
                className="btn ghost"
                href={`https://wa.me/${waHref}?text=Hola%20BESO,%20necesito%20ayuda`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Escribir por WhatsApp
              </a>
            </p>
            {data?.horario && (
              <p className="muted text-sm mt-1">
                Respuesta usual en horas hábiles.
              </p>
            )}
          </article>
        )}

        {/* Correo */}
        {data?.email && (
          <article className="panel p-5">
            <div className="flex items-center gap-2 mb-1">
              <MailIcon />
              <h3 className="font-bold">Correo</h3>
            </div>
            <p>
              <a className="link" href={`mailto:${data.email}`}>
                {data.email}
              </a>
            </p>
            <p className="muted text-sm">
              Consultas de pedidos y devoluciones.
            </p>
          </article>
        )}

        {/* Redes */}
        {(data?.instagram || data?.facebook || data?.tiktok) && (
          <article className="panel p-5">
            <div className="flex items-center gap-2 mb-1">
              <ShareIcon />
              <h3 className="font-bold">Redes sociales</h3>
            </div>
            <ul className="grid gap-2">
              {data.instagram && (
                <li>
                  <a
                    className="link"
                    href={data.instagram}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Instagram
                  </a>
                </li>
              )}
              {data.facebook && (
                <li>
                  <a
                    className="link"
                    href={data.facebook}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Facebook
                  </a>
                </li>
              )}
              {data.tiktok && (
                <li>
                  <a
                    className="link"
                    href={data.tiktok}
                    target="_blank"
                    rel="noreferrer"
                  >
                    TikTok
                  </a>
                </li>
              )}
            </ul>
          </article>
        )}
      </div>

      {/* Dirección + mapa */}
      <div className="grid gap-6" style={{ gridTemplateColumns: "1fr 1fr" }}>
        {data?.direccion && (
          <article className="panel p-5">
            <div className="flex items-center gap-2 mb-2">
              <MapPinIcon />
              <h3 className="font-bold">Nuestra ubicación</h3>
            </div>
            <p className="mb-2">{data.direccion}</p>
            <p className="muted text-sm"></p>
          </article>
        )}

        <article className="panel p-0 overflow-hidden">
          {data?.mapaEmbed ? (
            <div dangerouslySetInnerHTML={{ __html: data.mapaEmbed }} />
          ) : (
            <div className="p-5 muted">Mapa no configurado.</div>
          )}
        </article>
      </div>

      {/* >>> Formulario plegable para enviar mensaje <<< */}
      <div className="mt-6">
        <ContactForm />
      </div>
    </section>
  );
}
