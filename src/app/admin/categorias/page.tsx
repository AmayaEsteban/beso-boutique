export default function CategoriasPage() {
  return (
    <section className="w-full">
      <h1 className="text-2xl font-bold mb-4">Categorias</h1>

      <div className="panel p-4 mb-4">
        <div className="flex items-center gap-2">
          <input
            className="input"
            placeholder="Nueva categoría…"
            style={{ maxWidth: 360 }}
          />
          <button className="btn btn--primary">Agregar</button>
        </div>
      </div>

      <div className="panel p-0">
        <table className="table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Descripción</th>
              <th style={{ width: 120 }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Vestidos</td>
              <td>Prendas de vestir tipo vestido</td>
              <td>
                <button className="btn btn--neutral">Editar</button>
              </td>
            </tr>
            <tr>
              <td>Blusas</td>
              <td>Blusas y tops</td>
              <td>
                <button className="btn btn--neutral">Editar</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
