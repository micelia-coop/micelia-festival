import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Layout from './components/Layout'
import { Spinner } from './components/ui'
import Inicio from './pages/public/Inicio'
import { useConfig } from './lib/config'
import type { Sitio } from './lib/types'

const Desafio = lazy(() => import('./pages/public/Desafio'))
const Entradas = lazy(() => import('./pages/public/Entradas'))
const MiPedido = lazy(() => import('./pages/public/MiPedido'))
const MiEntrada = lazy(() => import('./pages/public/MiEntrada'))
const Marcas = lazy(() => import('./pages/public/Marcas'))
const MarcaFicha = lazy(() => import('./pages/public/MarcaFicha'))
const BolsaRitual = lazy(() => import('./pages/public/BolsaRitual'))
const SumaTuMarca = lazy(() => import('./pages/public/SumaTuMarca'))
const Info = lazy(() => import('./pages/public/Info'))
const NoEncontrado = lazy(() => import('./pages/public/NoEncontrado'))
const Panel = lazy(() => import('./pages/panel/Panel'))

/** Muestra la sección solo si está habilitada en Configuración → Sitio público; si no, vuelve al inicio. */
function Seccion({ flag, children }: { flag: keyof Sitio; children: React.ReactNode }) {
  const { config, cargando } = useConfig()
  if (cargando) return <Spinner />
  return config.sitio[flag] ? <>{children}</> : <Navigate to="/" replace />
}

function ScrollArriba() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

export default function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <ScrollArriba />
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Inicio />} />
          <Route path="desafio" element={<Desafio />} />
          <Route path="entradas" element={<Seccion flag="mostrar_entradas"><Entradas /></Seccion>} />
          <Route path="p/:token" element={<MiPedido />} />
          <Route path="e/:token" element={<MiEntrada />} />
          <Route path="marcas" element={<Seccion flag="mostrar_marcas"><Marcas /></Seccion>} />
          <Route path="marcas/:slug" element={<Seccion flag="mostrar_marcas"><MarcaFicha /></Seccion>} />
          <Route path="bolsa-ritual" element={<Seccion flag="mostrar_bolsa"><BolsaRitual /></Seccion>} />
          <Route path="suma-tu-marca" element={<Seccion flag="mostrar_postulacion"><SumaTuMarca /></Seccion>} />
          <Route path="info" element={<Seccion flag="mostrar_info"><Info /></Seccion>} />
          <Route path="*" element={<NoEncontrado />} />
        </Route>
        <Route path="panel/*" element={<Panel />} />
      </Routes>
    </Suspense>
  )
}
