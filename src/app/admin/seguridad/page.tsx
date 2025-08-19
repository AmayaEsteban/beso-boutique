export default function SeguridadPage() {
  return (
    <section className="w-full">
      <h1 className="text-2xl font-bold mb-4">Seguridad</h1>

      <div className="panel p-4">
        <ul className="list-disc pl-5 space-y-2">
          <li>Roles: ADMIN, EMPLEADO, CLIENTE.</li>
          <li>Sesiones JWT con expiración.</li>
          <li>Intentos de login limitados (pendiente implementar).</li>
        </ul>
        <div className="mt-3">
          <button className="btn btn--danger">
            Revocar todas las sesiones
          </button>
        </div>
      </div>
    </section>
  );
}
