export default function ConfiguracionPage() {
  return (
    <section className="w-full">
      <h1 className="text-2xl font-bold mb-4">Configuracion</h1>

      <div className="panel p-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold mb-1">
              Nombre de la tienda
            </label>
            <input className="input" defaultValue="BESO Boutique" />
          </div>
          <div>
            <label className="block font-semibold mb-1">Correo contacto</label>
            <input className="input" defaultValue="contacto@beso.com" />
          </div>
          <div className="md:col-span-2">
            <button className="btn btn--primary">Guardar cambios</button>
          </div>
        </div>
      </div>
    </section>
  );
}
