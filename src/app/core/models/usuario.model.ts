/** Espejo de los 4 roles fijos de `com.productividad.usuario.Rol` en el backend. */
export type Rol = 'EMPLEADO' | 'JEFE_INMEDIATO' | 'DIRECCION' | 'ADMIN';

/** Espejo de `UsuarioResponse` del backend — lo que devuelve /api/auth/login, /me y /api/usuarios. */
export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: Rol;
  activo: boolean;
  equipoId: number | null;
  equipoNombre: string | null;
}
