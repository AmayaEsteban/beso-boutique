export const metadata = {
  title: "Contáctanos | BESO Boutique",
  description:
    "Comunícate con BESO Boutique: teléfono, WhatsApp, correo, redes sociales, horarios y ubicación.",
};

export default function ContactoPage() {
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
        <article className="panel p-5">
          <h3 className="font-bold mb-1">Teléfono</h3>
          <p>
            <a className="link" href="tel:+50255555555">
              (+502) 5555-5555
            </a>
          </p>
          <p className="muted text-sm">L–V 9:00–18:00 · S 9:00–13:00</p>
        </article>

        <article className="panel p-5">
          <h3 className="font-bold mb-1">WhatsApp</h3>
          <p>
            <a
              className="btn ghost"
              href="https://wa.me/50255555555?text=Hola%20BESO,%20necesito%20ayuda"
              target="_blank"
              rel="noopener noreferrer"
            >
              Escribir por WhatsApp
            </a>
          </p>
          <p className="muted text-sm">Respuesta usual en horas hábiles.</p>
        </article>

        <article className="panel p-5">
          <h3 className="font-bold mb-1">Correo</h3>
          <p>
            <a className="link" href="mailto:soporte@beso.com">
              soporte@beso.com
            </a>
          </p>
          <p className="muted text-sm">Consultas de pedidos y devoluciones.</p>
        </article>

        <article className="panel p-5">
          <h3 className="font-bold mb-1">Redes sociales</h3>
          <ul className="grid gap-2">
            <li>
              <a
                className="link"
                href="https://instagram.com/beso.boutique"
                target="_blank"
                rel="noreferrer"
              >
                Instagram
              </a>
            </li>
            <li>
              <a
                className="link"
                href="https://facebook.com/beso.boutique"
                target="_blank"
                rel="noreferrer"
              >
                Facebook
              </a>
            </li>
            <li>
              <a
                className="link"
                href="https://tiktok.com/@beso.boutique"
                target="_blank"
                rel="noreferrer"
              >
                TikTok
              </a>
            </li>
          </ul>
        </article>
      </div>

      {/* Dirección + mapa */}
      <div className="grid gap-6" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <article className="panel p-5">
          <h3 className="font-bold mb-2">Nuestra ubicación</h3>
          <p className="mb-2">
            Zona 14, Ciudad de Guatemala <br />
            Punto de entrega y bodega (visitas con cita).
          </p>
          <p className="muted text-sm">
            *Estos datos son de ejemplo. Puedes pasarnos los reales y los
            cambiamos en segundos.
          </p>
        </article>

        <article className="panel p-0 overflow-hidden">
          <iframe
            title="Mapa BESO"
            width="100%"
            height="320"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            // Mapa de ejemplo — reemplaza cuando tengas la dirección final
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3876!2d-90.51!3d14.61!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sBESO!5e0!3m2!1ses!2sgt!4v0000000000"
            style={{ border: 0 }}
            aria-label="Mapa de BESO"
          />
        </article>
      </div>
    </section>
  );
}
