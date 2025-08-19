export default function ReportesPage() {
  return (
    <section className="w-full">
      <h1 className="text-2xl font-bold mb-4">Reportes</h1>

      <div className="panel p-4 mb-4">
        <div className="grid sm:grid-cols-2 gap-3">
          <button className="btn btn--neutral">Ventas por día</button>
          <button className="btn btn--neutral">Productos más vendidos</button>
          <button className="btn btn--neutral">Clientes frecuentes</button>
          <button className="btn btn--neutral">Inventario bajo</button>
        </div>
      </div>

      <div className="alert alert--warning">
        Este módulo es un demo: más adelante conectamos los datos reales.
      </div>
    </section>
  );
}
