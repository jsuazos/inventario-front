export default async function obtenerConfiguracionActiva() {
  const res = await fetch('config.json');
  const config = await res.json();

  const host = window.location.hostname;

  const esLocal = host === 'localhost' || host === '127.0.0.1';

  const entorno = esLocal ? 'local' : 'produccion';
  const apiUrl = config.entornos[entorno].apiUrl;

//   console.log(`Entorno detectado: ${entorno}`);
//   console.log(`API URL: ${apiUrl}`);

  return { entorno, apiUrl };
}
