/** Espejo de los 4 roles fijos de `com.productividad.usuario.Rol` en el backend. */
export type Rol = 'EMPLEADO' | 'JEFE_INMEDIATO' | 'DIRECCION' | 'ADMIN';

/** Espejo de `UsuarioResponse` del backend — lo que devuelve /api/auth/login, /me. */
export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: Rol;
  equipoId: number | null;
}
