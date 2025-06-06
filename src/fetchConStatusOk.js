export default async function fetchConStatusOk(url, opciones = {}) {
  try {
    const respuesta = await fetch(url, opciones);

    const data = await respuesta.json(); // tu API siempre responde JSON, incluso con error

    if (!respuesta.ok) {
      // Tu backend devuelve { error: '...' }
      throw new Error(data.error || `Error ${respuesta.status}`);
    }

    return data; // Solo llega aquí si status 2xx

  } catch (error) {
    // Puede ser error de red o error lanzado por el backend
    // console.error('Error en fetchConStatusOk:', error.message);
    throw error;
  }
}
