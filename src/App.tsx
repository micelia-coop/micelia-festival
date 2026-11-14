import { lazy, Suspense, useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import Layout from './components/Layout'
import { Spinner } from './components/ui'
import Inicio from './pages/public/Inicio'

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
          <Route path="entradas" element={<Entradas />} />
          <Route path="p/:token" element={<MiPedido />} />
          <Route path="e/:token" element={<MiEntrada />} />
          <Route path="marcas" element={<Marcas />} />
          <Route path="marcas/:slug" element={<MarcaFicha />} />
          <Route path="bolsa-ritual" element={<BolsaRitual />} />
          <Route path="suma-tu-marca" element={<SumaTuMarca />} />
          <Route path="info" element={<Info />} />
          <Route path="*" element={<NoEncontrado />} />
        </Route>
        <Route path="panel/*" element={<Panel />} />
      </Routes>
    </Suspense>
  )
}
