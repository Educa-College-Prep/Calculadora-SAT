import { useEffect, useState } from 'react';

/**
 * ¿La pantalla cumple esta media query? Se actualiza al girar el celular o cambiar el ancho
 * de la ventana. Para lo que no se puede resolver solo con CSS: en celular, por ejemplo, el
 * mapa no se dibuja en la página sino en una capa aparte.
 */
export function useMedia(consulta: string): boolean {
  const [cumple, setCumple] = useState(() => window.matchMedia(consulta).matches);

  useEffect(() => {
    const media = window.matchMedia(consulta);
    const alCambiar = () => setCumple(media.matches);
    alCambiar();
    media.addEventListener('change', alCambiar);
    return () => media.removeEventListener('change', alCambiar);
  }, [consulta]);

  return cumple;
}
