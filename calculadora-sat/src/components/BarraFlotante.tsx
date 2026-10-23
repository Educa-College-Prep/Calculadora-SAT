import type { ReactNode } from 'react';

/**
 * Botones que flotan arriba, debajo de la barra de Educa, solo cuando `visible`. Al ocultarse
 * se deslizan hacia arriba (sin saltos en la página) y quedan "inert": ni el teclado ni un
 * lector de pantalla llegan a botones que no se ven.
 */
export function BarraFlotante({ visible, children }: { visible: boolean; children: ReactNode }) {
  return (
    <div className={`barra-flotante${visible ? ' barra-flotante-visible' : ''}`} inert={!visible}>
      {children}
    </div>
  );
}
