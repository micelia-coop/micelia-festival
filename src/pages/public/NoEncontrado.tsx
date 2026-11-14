import { LinkButton } from '../../components/ui'
export default function NoEncontrado() {
  return (
    <div className="py-16 text-center">
      <h1 className="text-4xl font-bold">Este sendero no existe 🍄</h1>
      <p className="mt-2">Volvé al inicio del bosque.</p>
      <LinkButton to="/" className="mt-6">Ir al inicio</LinkButton>
    </div>
  )
}
