import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

export default function QrCode({ valor, tam = 280, apagado }: { valor: string; tam?: number; apagado?: boolean }) {
  const [src, setSrc] = useState('')
  useEffect(() => {
    QRCode.toDataURL(valor, { width: tam * 2, margin: 1, errorCorrectionLevel: 'M', color: { dark: '#2A4030', light: '#FFFFFF' } })
      .then(setSrc)
  }, [valor, tam])
  if (!src) return <div style={{ width: tam, height: tam }} className="rounded-2xl bg-white" />
  return <img src={src} width={tam} height={tam} alt="Código QR de tu entrada" className={`rounded-2xl bg-white ${apagado ? 'opacity-25 grayscale' : ''}`} />
}
