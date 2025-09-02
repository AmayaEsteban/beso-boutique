export const metadata = {
  title: "Sobre nosotros | BESO Boutique",
  description:
    "Conoce la historia, misión, visión y valores de BESO Boutique. Moda con calidad, atención cercana y envíos a todo el país.",
};

export default function SobreNosotrosPage() {
  return (
    <section
      className="container"
      style={{ maxWidth: 1040, padding: "2rem 1rem" }}
    >
      {/* Hero */}
      <header className="panel p-6 mb-6" style={{ textAlign: "center" }}>
        <h1 className="text-3xl font-bold">Sobre BESO Boutique</h1>
        <p className="muted mt-2">
          Moda que se siente bien: calidad, estilo y un servicio que te
          acompaña.
        </p>
      </header>

      {/* Misión y visión */}
      <div
        className="grid gap-6 mb-6"
        style={{ gridTemplateColumns: "1fr 1fr" }}
      >
        <article className="panel p-5">
          <h3 className="font-bold mb-2">Nuestra misión</h3>
          <p>
            Ofrecer prendas actuales con excelente relación calidad–precio y una
            experiencia de compra sencilla, humana y confiable.
          </p>
        </article>
        <article className="panel p-5">
          <h3 className="font-bold mb-2">Nuestra visión</h3>
          <p>
            Ser la boutique online referente de la región por innovación,
            cercanía y consistencia en cada entrega.
          </p>
        </article>
      </div>

      {/* Valores */}
      <section className="panel p-5 mb-6">
        <h3 className="font-bold mb-3">Nuestros valores</h3>
        <ul
          className="grid gap-4"
          style={{ gridTemplateColumns: "repeat(3, 1fr)" }}
        >
          <li>
            <b>Cercanía</b>
            <br />
            Escuchamos, orientamos y resolvemos.
          </li>
          <li>
            <b>Calidad</b>
            <br />
            Prendas y acabados que te acompañan más tiempo.
          </li>
          <li>
            <b>Confianza</b>
            <br />
            Pagos seguros y políticas claras.
          </li>
        </ul>
      </section>

      {/* Historia (línea de tiempo) */}
      <section className="panel p-5 mb-6">
        <h3 className="font-bold mb-3">Nuestra historia</h3>
        <ol className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <li>
            <b>2023</b> — Nace la idea de BESO como proyecto familiar.
          </li>
          <li>
            <b>2024</b> — Lanzamos catálogo online y primeros envíos nacionales.
          </li>
          <li>
            <b>2025</b> — Ampliamos categorías y optimizamos logística.
          </li>
          <li>
            <b>Hoy</b> — Crecemos contigo, mejorando colección a colección.
          </li>
        </ol>
      </section>

      {/* CTA */}
      <div className="panel p-5" style={{ textAlign: "center" }}>
        <h3 className="font-bold mb-2">¿Hablamos?</h3>
        <p className="mb-4">
          Si necesitas asesoría de tallas o estilo, estamos para ayudarte.
        </p>
        <a href="/contacto" className="btn primary">
          Ir a Contáctanos
        </a>
      </div>
    </section>
  );
}
