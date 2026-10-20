import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BarraEduca } from './components/BarraEduca.tsx'

// La barra de Educa va en su propio contenedor, fuera de #root: así ocupa todo el ancho
// sin depender de los márgenes de la página ni del panel del asistente.
createRoot(document.getElementById('barra')!).render(
  <StrictMode>
    <BarraEduca />
  </StrictMode>,
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
