export default function ClientesPage() {
  return (
    <section className="w-full">
      <h1 className="text-2xl font-bold mb-4">Clientes</h1>

      <div className="panel p-4 mb-4">
        <div className="flex gap-2">
          <input
            className="input"
            placeholder="Buscar cliente por nombre o correo…"
          />
          <button className="btn btn--neutral">Buscar</button>
        </div>
      </div>

      <div className="panel p-0">
        <table className="table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Teléfono</th>
              <th>Fecha registro</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Ana López</td>
              <td>ana@correo.com</td>
              <td>5555-5555</td>
              <td>2025-01-02</td>
            </tr>
            <tr>
              <td>María Pérez</td>
              <td>maria@correo.com</td>
              <td>4444-4444</td>
              <td>2025-01-05</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
