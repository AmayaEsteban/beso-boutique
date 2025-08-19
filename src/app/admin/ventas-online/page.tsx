export default function VentasOnlinePage() {
  return (
    <section className="w-full">
      <h1 className="text-2xl font-bold mb-4">Ventas online</h1>

      <div className="panel p-4 mb-4">
        <p className="muted">Demo de pedidos realizados en la tienda online.</p>
      </div>

      <div className="panel p-0">
        <table className="table">
          <thead>
            <tr>
              <th>#Pedido</th>
              <th>Cliente</th>
              <th>Fecha</th>
              <th>Total</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>ON-00124</td>
              <td>Ana López</td>
              <td>2025-02-10</td>
              <td>Q 589.00</td>
              <td>pagado</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
