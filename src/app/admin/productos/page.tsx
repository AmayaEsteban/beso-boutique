export default function ProductosPage() {
  return (
    <section className="w-full">
      <h1 className="text-2xl font-bold mb-4">Productos</h1>

      <div className="panel p-4 mb-4">
        <p className="muted">
          Demo: listado de productos con acciones básicas.
        </p>
        <div className="mt-3 flex gap-2">
          <button className="btn btn--primary">Nuevo producto</button>
          <button className="btn btn--neutral">Importar</button>
        </div>
      </div>

      <div className="panel p-0 overflow-hidden">
        <table className="table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Nombre</th>
              <th>Categoría</th>
              <th>Stock</th>
              <th>Precio</th>
              <th style={{ width: 120 }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {[
              {
                sku: "P-0001",
                nombre: "Vestido Rojo",
                cat: "Vestidos",
                stock: 8,
                precio: "Q 349.00",
              },
              {
                sku: "P-0002",
                nombre: "Blusa Blanca",
                cat: "Blusas",
                stock: 3,
                precio: "Q 189.00",
              },
              {
                sku: "P-0003",
                nombre: "Pantalón Negro",
                cat: "Pantalones",
                stock: 12,
                precio: "Q 279.00",
              },
            ].map((p) => (
              <tr key={p.sku}>
                <td>{p.sku}</td>
                <td>{p.nombre}</td>
                <td>{p.cat}</td>
                <td>{p.stock}</td>
                <td>{p.precio}</td>
                <td>
                  <div className="flex gap-2">
                    <button className="btn btn--neutral">Editar</button>
                    <button className="btn btn--danger">Borrar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
