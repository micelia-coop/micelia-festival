import { Html5Qrcode } from 'html5-qrcode'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Button, Input } from './ui'

/** Escáner de QR con la cámara trasera + campo para tipear el código si la cámara falla. */
export default function Escaner({ onLeer, ocupado }: { onLeer: (texto: string) => void; ocupado?: boolean }) {
  const [activo, setActivo] = useState(false)
  const [error, setError] = useState('')
  const [manual, setManual] = useState('')
  const ref = useRef<Html5Qrcode | null>(null)
  const id = 'lector-qr'

  async function detener() {
    try { if (ref.current?.isScanning) await ref.current.stop() } catch { /* nada */ }
    setActivo(false)
  }

  async function iniciar() {
    setError('')
    try {
      ref.current = ref.current ?? new Html5Qrcode(id)
      setActivo(true)
      await ref.current.start({ facingMode: 'environment' }, { fps: 10, qrbox: { width: 240, height: 240 } },
        (texto) => { detener(); onLeer(texto) }, () => {})
    } catch {
      setActivo(false)
      setError('No pudimos abrir la cámara. Revisá los permisos del navegador o tipeá el código.')
    }
  }

  useEffect(() => () => { detener() }, [])

  function enviarManual(e: FormEvent) {
    e.preventDefault()
    if (manual.trim()) { onLeer(manual.trim().toUpperCase()); setManual('') }
  }

  return (
    <div className="space-y-3">
      <div id={id} className={`overflow-hidden rounded-3xl bg-black ${activo ? '' : 'hidden'}`} />
      {activo
        ? <Button grande variante="borde" onClick={detener}>Cancelar</Button>
        : <Button grande disabled={ocupado} className="!py-6 text-2xl" onClick={iniciar}>📷 Escanear entrada</Button>}
      {error && <p className="rounded-2xl bg-error px-4 py-3 font-bold text-white">{error}</p>}
      <form onSubmit={enviarManual} className="flex gap-2">
        <Input placeholder="O tipeá el código: MIC-XXXX" value={manual} onChange={(e) => setManual(e.target.value)}
          autoCapitalize="characters" aria-label="Código de la entrada" className="text-lg" />
        <Button variante="suave" disabled={ocupado}>Buscar</Button>
      </form>
    </div>
  )
}
