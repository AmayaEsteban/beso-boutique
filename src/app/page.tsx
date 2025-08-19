// src/app/page.tsx
export default function Home() {
  return (
    <section className="grid gap-8">
      <div className="panel shadow-card p-6">
        <h1 className="mb-2 text-2xl font-bold">Catálogo — Demo estilos</h1>
        <p className="muted">
          Estos componentes usan las clases globales de BESO.
        </p>
      </div>

      {/* Botones */}
      <div className="panel shadow-card p-6">
        <h2 className="mb-4 text-xl font-semibold">Botones</h2>
        <div className="flex flex-wrap gap-3">
          <button className="btn btn--primary">Primario</button>
          <button className="btn btn--secondary">Secundario</button>
          <button className="btn btn--neutral">Neutro</button>
          <button className="btn btn--success">Éxito</button>
          <button className="btn btn--danger">Peligro</button>
        </div>
      </div>

      {/* Inputs */}
      <div className="panel shadow-card p-6">
        <h2 className="mb-4 text-xl font-semibold">Formulario</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="muted text-sm">Nombre del producto</label>
            <input className="input mt-1" placeholder="Vestido Rojo" />
          </div>
          <div>
            <label className="muted text-sm">Precio (Q)</label>
            <input type="number" className="input mt-1" placeholder="349.99" />
          </div>
          <div>
            <label className="muted text-sm">Categoría</label>
            <select className="select mt-1">
              <option>Vestidos</option>
              <option>Blusas</option>
              <option>Pantalones</option>
            </select>
          </div>
          <div>
            <label className="muted text-sm">Descripción</label>
            <textarea
              className="textarea mt-1"
              rows={3}
              placeholder="Detalles del producto..."
            />
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          <button className="btn btn--primary">Guardar</button>
          <button className="btn btn--neutral">Limpiar</button>
        </div>
      </div>

      {/* Alertas */}
      <div className="panel shadow-card p-6">
        <h2 className="mb-4 text-xl font-semibold">Alertas</h2>
        <div className="grid gap-3">
          <div className="alert alert--success">
            Éxito: operación realizada correctamente.
          </div>
          <div className="alert alert--warning">
            Aviso: revisa los campos resaltados.
          </div>
          <div className="alert alert--error">Error: no se pudo guardar.</div>
        </div>
      </div>
    </section>
  );
}
