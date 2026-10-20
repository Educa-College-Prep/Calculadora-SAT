import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Universidad } from '../types';

/**
 * "Mi lista": universidades guardadas con la estrella. Se guardan en el navegador
 * de cada persona (localStorage), no en un servidor: si cambia de navegador o borra
 * los datos del sitio, la lista empieza vacía.
 */

// El nombre viejo se queda: cambiarlo borraría las listas que la gente ya guardó.
const CLAVE_ALMACEN = 'calculadora-sat:mi-lista';

/** Identificador estable entre recargas: _id es la posición en el JSON y cambia si cambia la data. */
export const claveUniversidad = (uni: Pick<Universidad, 'INSTNM' | 'CITY' | 'STABBR'>) =>
  `${uni.INSTNM}|${uni.CITY}|${uni.STABBR}`;

function leer(): string[] {
  try {
    const valor = JSON.parse(localStorage.getItem(CLAVE_ALMACEN) ?? '[]');
    return Array.isArray(valor) ? valor.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    // Navegación privada o almacenamiento bloqueado: la lista funciona igual, sin recordarse.
    return [];
  }
}

function escribir(claves: string[]) {
  try {
    localStorage.setItem(CLAVE_ALMACEN, JSON.stringify(claves));
  } catch {
    // Sin almacenamiento disponible: se mantiene solo mientras la página esté abierta.
  }
}

export function useMiLista() {
  // En el orden en que se guardaron: así se comparan en ese mismo orden.
  const [claves, setClaves] = useState<string[]>(leer);

  // Si la persona tiene la página abierta en otra pestaña, se mantienen sincronizadas.
  useEffect(() => {
    const alCambiar = (e: StorageEvent) => { if (e.key === CLAVE_ALMACEN) setClaves(leer()); };
    window.addEventListener('storage', alCambiar);
    return () => window.removeEventListener('storage', alCambiar);
  }, []);

  const actualizar = useCallback((cambio: (previas: string[]) => string[]) => {
    setClaves(previas => {
      const nuevas = cambio(previas);
      escribir(nuevas);
      return nuevas;
    });
  }, []);

  const alternar = useCallback((uni: Universidad) => {
    const clave = claveUniversidad(uni);
    actualizar(previas => previas.includes(clave) ? previas.filter(c => c !== clave) : [...previas, clave]);
  }, [actualizar]);

  const quitar = useCallback((uni: Universidad) => {
    const clave = claveUniversidad(uni);
    actualizar(previas => previas.filter(c => c !== clave));
  }, [actualizar]);

  const vaciar = useCallback(() => actualizar(() => []), [actualizar]);

  const guardadas = useMemo(() => new Set(claves), [claves]);

  return { claves, guardadas, alternar, quitar, vaciar };
}
