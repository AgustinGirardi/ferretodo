import bcrypt from "bcryptjs";

/**
 * Hash de descarte para nivelar el tiempo de respuesta del login.
 *
 * Sin esto el formulario decía la verdad con el reloj: si el email no existía,
 * `findUnique` fallaba y bcrypt NUNCA llegaba a ejecutarse (~5 ms); si existía,
 * la comparación costaba ~100 ms. Una diferencia de más de un orden de magnitud
 * se mide con una decena de requests y sirve para enumerar clientes y, peor,
 * para descubrir el email del admin, que es la precondición de cualquier ataque
 * de fuerza bruta contra el panel.
 *
 * Es el hash bcrypt (cost 10, el mismo que usa el registro) de una cadena
 * aleatoria de 32 bytes que no se guardó en ninguna parte: ninguna contraseña
 * puede coincidir. No es un secreto —solo tiene que costar lo mismo que un hash
 * real— así que vivir en el repositorio no lo debilita.
 */
const DUMMY_HASH = "$2a$10$4y0Js7.eOYwgT2MM8O1y/uKVPk0YlVlj6MJxhHD607hRA/Phz/jii";

/**
 * Gasta el mismo tiempo que una comparación real. Se llama en los caminos donde
 * no hay hash contra el cual comparar (email inexistente, o cuenta de Google sin
 * contraseña propia) para que todos los finales del login duren lo mismo.
 */
export async function equalizeLoginTiming(password: string): Promise<void> {
  await bcrypt.compare(password, DUMMY_HASH);
}
