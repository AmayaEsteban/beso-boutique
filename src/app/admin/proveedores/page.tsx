export default function ProveedoresPage() {
  return (
    <section className="w-full">
      <h1 className="text-2xl font-bold mb-4">Proveedores</h1>

      <div className="panel p-4 mb-4">
        <button className="btn btn--primary">Nuevo proveedor</button>
      </div>

      <div className="panel p-0">
        <table className="table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Contacto</th>
              <th>Teléfono</th>
              <th>Correo</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Moda GT</td>
              <td>Sofía G.</td>
              <td>5555-8888</td>
              <td>ventas@modagt.com</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
