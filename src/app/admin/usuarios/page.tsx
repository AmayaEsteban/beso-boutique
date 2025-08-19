export default function UsuariosPage() {
  return (
    <section className="w-full">
      <h1 className="text-2xl font-bold mb-4">Usuarios</h1>

      <div className="panel p-4 mb-4">
        <button className="btn btn--primary">Nuevo usuario</button>
      </div>

      <div className="panel p-0">
        <table className="table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Rol</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Admin BESO</td>
              <td>admin@beso.com</td>
              <td>ADMIN</td>
              <td>activo</td>
            </tr>
            <tr>
              <td>Empleado 1</td>
              <td>empleado@beso.com</td>
              <td>EMPLEADO</td>
              <td>activo</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
