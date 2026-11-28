export type Festival = {
  nombre: string; organiza?: string; fecha: string; inicio_manana?: string; inicio_tarde?: string
  lugar?: string | null; lugar_direccion?: string | null; lugar_maps_url?: string | null; bajada?: string
  telegram_url?: string | null; instagram_url?: string | null; whatsapp_contacto?: string | null
}
export type Pago = { billetera?: string; alias?: string | null; cvu?: string | null; titular?: string | null }
export type Ventas = { entradas_abiertas?: boolean; bolsas_abiertas?: boolean; mensaje_cerrado?: string; mercadopago?: boolean }
export type DesafioCfg = { titulo?: string; bajada?: string; gestiona?: string; consentimiento?: string; canal_url?: string; canal_texto?: string; instagram_respira?: string }
export type Faq = { p: string; r: string }[]
export type Sitio = {
  teaser: boolean
  mostrar_entradas: boolean; mostrar_bolsa: boolean; mostrar_marcas: boolean
  mostrar_postulacion: boolean; mostrar_info: boolean; mostrar_recorrido: boolean; mostrar_propuesta: boolean
  teaser_kicker?: string; teaser_titulo?: string; teaser_bajada?: string
  teaser_fecha_label?: string; teaser_fecha?: string; cuenta_hasta?: string
  teaser_img_movil?: string | null; teaser_img_desktop?: string | null; teaser_velo?: boolean
}

export type Config = {
  festival: Festival; pago: Pago; ventas: Ventas; desafio: DesafioCfg; faq: Faq
  bolsa: { direccion_petruca?: string; titulo?: string; bajada?: string; descuento_entrada_pct?: string | number | null }; canje: { fecha?: string; desde?: string; hasta?: string }
  sitio: Sitio
  propuesta?: unknown
  recorrido?: unknown
}

export type TipoEntrada = {
  id: string; nombre: string; descripcion: string | null; precio: number; cupo: number | null
  restantes: number | null; incluye_almuerzo: boolean; incluye_festival: boolean; valor_canje: number; orden: number
  pregunta_mat: boolean; descuento_bolsa?: boolean
}

export type Marca = {
  id: string; nombre: string; slug: string; tipo: string; rubro: string | null; descripcion: string | null
  logo_path: string | null; instagram: string | null; whatsapp: string | null; web: string | null
  estado: 'postulada' | 'confirmada' | 'rechazada'; en_guia_regalos: boolean; participa_festival: boolean; orden: number
  contacto_interno?: string | null; notas_internas?: string | null; created_at?: string
  registro_token?: string | null; registro_abierto?: boolean; registro_completado_at?: string | null
  registro_extra?: Record<string, string>
}

export type Producto = {
  id: string; marca_id: string; nombre: string; descripcion: string | null; precio: number | null
  foto_path: string | null; disp_previa: boolean; disp_festival: boolean; disp_post: boolean
  agregable_a_bolsa: boolean; activo: boolean; orden: number
}

export type PedidoEstado = 'pendiente' | 'comprobante_enviado' | 'pagado' | 'rechazado' | 'vencido' | 'cancelado'

export type PedidoPublico = {
  codigo: string; token: string; tipo: 'entrada' | 'bolsa'; nombre: string; total: number; descuento?: number; descuento_entrada?: string | null
  metodo_pago: 'transferencia' | 'efectivo' | 'mercadopago'; estado: PedidoEstado; vence_at: string | null
  tiene_comprobante: boolean; es_regalo: boolean; regalo_para: string | null
  entrega: 'retiro_petruca' | 'retiro_festival' | null; entregado: boolean; created_at: string
  items: { item_tipo: string; nombre: string; cantidad: number; precio_unit: number }[]
  entradas: { token: string; codigo_corto: string; titular_nombre: string; tipo: string; activa: boolean; trae_mat: boolean | null; numero?: number }[]
  pago: Pago
}

export type EntradaPublica = {
  token: string; codigo_corto: string; numero?: number; titular_nombre: string; activa: boolean
  ingreso_at: string | null; almuerzo_at: string | null; trae_mat: boolean | null
  tipo: { nombre: string; descripcion: string | null; incluye_almuerzo: boolean; incluye_festival: boolean; valor_canje: number; pregunta_mat: boolean; descuento_bolsa?: boolean }
  pedido: { codigo: string; estado: PedidoEstado; metodo_pago: string }
  canje: { puesto: string; at: string } | null
  descuento_bolsa_usado?: boolean
}

export const COLS_MARCA_PUBLICA =
  'id,nombre,slug,tipo,rubro,descripcion,logo_path,instagram,whatsapp,web,estado,en_guia_regalos,participa_festival,orden'
