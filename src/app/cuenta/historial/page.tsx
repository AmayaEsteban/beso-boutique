export default function HistorialComprasPage() {
  // Más adelante listaremos ventas del cliente autenticado
  return (
    <section className="panel" style={{ padding: 16 }}>
      <h1 className="text-2xl font-bold mb-2">Historial de compras</h1>
      <p className="muted mb-4">
        Aquí verás las compras que has realizado con tu cuenta.
      </p>

      <div className="muted">Aún no hay compras registradas.</div>
    </section>
  );
}
