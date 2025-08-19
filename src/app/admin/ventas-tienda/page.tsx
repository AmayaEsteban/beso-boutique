export default function VentasTiendaPage() {
  return (
    <section className="w-full">
      <h1 className="text-2xl font-bold mb-4">Ventas en tienda</h1>

      <div className="panel p-4 mb-4">
        <p className="muted">Demo de ventas físicas registradas en caja.</p>
      </div>

      <div className="panel p-0">
        <table className="table">
          <thead>
            <tr>
              <th>#Ticket</th>
              <th>Atendió</th>
              <th>Fecha</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>TI-00987</td>
              <td>Empleado 1</td>
              <td>2025-02-10</td>
              <td>Q 429.00</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
