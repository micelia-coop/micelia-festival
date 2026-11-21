/**
 * Festival de Solsticio · Micelia Cooperativa
 * Envío de mails desde el Gmail de Micelia.
 *
 * La base de datos (Supabase) llama a este script cada vez que pasa algo
 * (inscripción al desafío, registro de marca, pedido, pago validado...).
 * El script manda el mail a la persona y un aviso a la casilla de Micelia.
 * Todo queda en "Enviados" del Gmail de Micelia.
 *
 * CONFIGURACIÓN (Configuración del proyecto ⚙️ → Propiedades de la secuencia de comandos):
 *   SECRETO      → la clave que te da Supabase (obligatoria)
 *   AVISO_EMAIL  → a dónde llegan los avisos (opcional; si no está, va a esta misma cuenta)
 *
 * Para cambiar un texto: editá la sección TEXTOS de abajo y después
 * Implementar → Administrar implementaciones → ✏️ → Versión: Nueva versión → Implementar.
 */

const SITIO = 'https://festival-micelia.pages.dev';
const FIRMA = 'Micelia Cooperativa';

// ============================== TEXTOS ==============================

const TEXTOS = {

  desafio_inscripcion: (d) => ({
    asunto: '¡Bienvenida al Desafío de Gratitud! 💜',
    cuerpo: `
      <p>¡Hola ${nombre(d.nombre)}!</p>
      <p>Ya sos parte del <b>Desafío de Gratitud de 21 días</b> que preparamos junto a
      <b>Respira y Transfórmate</b>. Gracias por sumarte a este camino 🌿</p>
      <p>Cada día se habilita un video nuevo, cortito, para practicar la gratitud a tu ritmo.
      Los vas a encontrar acá:</p>
      ${boton(SITIO + '/desafio', 'Ir al desafío')}
      <p>Te recomendamos guardar ese link y elegir un momento del día para tu práctica.</p>
      <p>Y guardá esta fecha: el <b>sábado 19 de diciembre</b> cerramos el ciclo celebrando
      en comunidad en el <b>Festival de Solsticio</b>. Muy pronto te contamos más.</p>
      <p>Con gratitud,<br>${FIRMA}</p>`,
    aviso: `Nueva inscripta al desafío: ${d.nombre}`,
    avisoCuerpo: lista({ Nombre: d.nombre, Email: d.email, WhatsApp: d.whatsapp, Instagram: ig(d.instagram),
      Ciudad: d.ciudad, '¿Cómo se enteró?': d.como_se_entero, 'Total de inscriptas': d.total_inscriptas }),
  }),

  marca_postulacion: (d) => ({
    aviso: `Nueva postulación de marca: ${d.nombre}`,
    avisoCuerpo: lista({ Marca: d.nombre, Rubro: d.rubro, Instagram: ig(d.instagram), WhatsApp: d.whatsapp,
      Contacto: d.contacto, Descripción: d.descripcion, Mensaje: d.mensaje }) + boton(SITIO + '/panel/marcas', 'Ver en el panel'),
  }),

  marca_registro: (d) => ({
    // A la marca solo le escribimos la primera vez que completa el registro
    asunto: d.primera_vez ? `Recibimos el registro de ${d.nombre} 🌿` : null,
    cuerpo: `
      <p>¡Hola ${nombre(d.contacto_nombre)}!</p>
      <p>Recibimos el registro de <b>${esc(d.nombre)}</b> para el <b>Festival de Solsticio</b>
      del sábado 19 de diciembre. ¡Gracias por ser parte!</p>
      <p>Si necesitás cambiar algo (datos, logo o productos), podés volver a entrar con tu link personal:</p>
      ${boton(SITIO + '/' + d.registro_url, 'Editar mi registro')}
      <p>Ese link es solo para tu marca: no lo compartas.</p>
      <p>Cualquier duda, escribinos. Nos vemos en el bosque,<br>${FIRMA}</p>`,
    aviso: d.primera_vez ? `Marca registrada: ${d.nombre}` : `${d.nombre} actualizó su registro`,
    avisoCuerpo: lista({ Marca: d.nombre, Rubro: d.rubro, Instagram: ig(d.instagram), Contacto: d.contacto_nombre,
      WhatsApp: d.contacto_whatsapp, Email: d.contacto_email, 'Ofrece para el canje': d.canje_oferta,
      'Necesita para el puesto': d.necesidades, Productos: d.productos }) + boton(SITIO + '/panel/marcas', 'Ver en el panel'),
  }),

  pedido_nuevo: (d) => {
    const esEntrada = d.tipo === 'entrada';
    const que = esEntrada ? 'tu reserva de entradas' : 'tu pedido de la Bolsa Ritual';
    let pago;
    if (d.metodo_pago === 'transferencia') {
      pago = `
        <p><b>Para completar la compra:</b></p>
        <ol>
          <li>Transferí <b>${pesos(d.total)}</b> ${d.pago && d.pago.alias ? `al alias <b>${esc(d.pago.alias)}</b>` : 'al alias de Micelia'}
              ${d.pago && d.pago.titular ? `(titular: ${esc(d.pago.titular)})` : ''}, poniendo el código <b>${d.codigo}</b> en el concepto.</li>
          <li>Subí el comprobante en tu pedido:</li>
        </ol>
        ${boton(SITIO + '/p/' + d.token, 'Ver mi pedido y subir el comprobante')}
        <p>La reserva se mantiene 48 hs hasta que subas el comprobante.</p>`;
    } else {
      pago = `
        <p>Elegiste pagar <b>en efectivo</b>: abonás <b>${pesos(d.total)}</b> a una guardiana${esEntrada ? ' o en la puerta del festival' : ''},
        mencionando el código <b>${d.codigo}</b>. La reserva vence a las 48 hs si no se paga.</p>
        ${boton(SITIO + '/p/' + d.token, 'Ver mi pedido')}`;
    }
    return {
      asunto: `Recibimos ${que} · ${d.codigo}`,
      cuerpo: `
        <p>¡Hola ${nombre(d.nombre)}!</p>
        <p>Recibimos ${que} para el <b>Festival de Solsticio</b> 🌿</p>
        ${detalle(d)}
        ${pago}
        <p>Gracias por acompañar a las marcas emprendedoras,<br>${FIRMA}</p>`,
      aviso: `Nuevo pedido ${d.codigo}: ${d.nombre} · ${pesos(d.total)} · ${d.metodo_pago}`,
      avisoCuerpo: lista({ Código: d.codigo, Tipo: d.tipo, Nombre: d.nombre, WhatsApp: d.whatsapp, Email: d.email,
        Instagram: ig(d.instagram), Total: pesos(d.total), 'Forma de pago': d.metodo_pago, Canal: d.canal,
        Retiro: d.entrega, 'Para regalar': d.es_regalo ? `Sí, a ${d.regalo_para || '—'}` : null }) + detalle(d),
    };
  },

  pedido_comprobante_enviado: (d) => ({
    asunto: `Recibimos tu comprobante · ${d.codigo}`,
    cuerpo: `
      <p>¡Hola ${nombre(d.nombre)}!</p>
      <p>Recibimos el comprobante de tu pedido <b>${d.codigo}</b>. En cuanto lo validemos te avisamos
      ${d.tipo === 'entrada' ? 'y se activan tus entradas' : ''}.</p>
      ${boton(SITIO + '/p/' + d.token, 'Ver mi pedido')}
      <p>${FIRMA}</p>`,
    aviso: `💸 Comprobante para validar: ${d.codigo} · ${d.nombre} · ${pesos(d.total)}`,
    avisoCuerpo: lista({ Código: d.codigo, Nombre: d.nombre, Total: pesos(d.total) }) + boton(SITIO + '/panel/pagos', 'Validar en el panel'),
  }),

  pedido_pagado: (d) => {
    if (d.tipo === 'entrada') {
      const entradas = (d.entradas || []).map((e) =>
        `<li><b>${esc(e.titular_nombre)}</b> · ${esc(e.tipo)} · <a href="${SITIO}/e/${e.token}">Ver entrada (QR)</a></li>`).join('');
      return {
        asunto: '¡Tu entrada para el Festival de Solsticio está confirmada! 🎟️',
        cuerpo: `
          <p>¡Hola ${nombre(d.nombre)}!</p>
          <p>Confirmamos tu pago. ${(d.entradas || []).length > 1 ? 'Estas son tus entradas' : 'Esta es tu entrada'}:</p>
          <ul>${entradas}</ul>
          <p>El día del festival mostrá el QR desde tu celular (es un festival cero papel 🌱).
          Si compraste para otras personas, reenviales su link.</p>
          <p><b>Sábado 19 de diciembre</b>. ¡Nos vemos en el bosque!<br>${FIRMA}</p>`,
      };
    }
    return {
      asunto: `Confirmamos tu Bolsa Ritual · ${d.codigo} 🎁`,
      cuerpo: `
        <p>¡Hola ${nombre(d.nombre)}!</p>
        <p>Confirmamos el pago de tu <b>Bolsa Ritual</b>.</p>
        ${detalle(d)}
        <p>Retiro: <b>${d.entrega === 'retiro_petruca' ? 'en el local de Petruca (calle Espejo, Ciudad de Mendoza)' : 'el día del festival (19/12)'}</b>.
        Te avisamos cuando esté lista.</p>
        ${boton(SITIO + '/p/' + d.token, 'Ver mi pedido')}
        <p>Gracias por regalar consciente 🌿<br>${FIRMA}</p>`,
    };
  },

  pedido_rechazado: (d) => ({
    asunto: `No pudimos validar tu pago · ${d.codigo}`,
    cuerpo: `
      <p>¡Hola ${nombre(d.nombre)}!</p>
      <p>No pudimos validar el pago de tu pedido <b>${d.codigo}</b>. Puede que el comprobante no se vea bien
      o que el monto no coincida. ¿Nos lo mandás de nuevo?</p>
      ${boton(SITIO + '/p/' + d.token, 'Subir el comprobante otra vez')}
      <p>Si ya transferiste y creés que es un error, respondé este mail y lo revisamos.<br>${FIRMA}</p>`,
  }),

  prueba: () => ({
    aviso: '✅ Prueba de mails del Festival de Solsticio',
    avisoCuerpo: '<p>Si te llegó este mail, la conexión entre Supabase y el Gmail de Micelia funciona.</p>',
  }),
};

// ============================== MOTOR ==============================

function doPost(e) {
  try {
    const pedido = JSON.parse(e.postData.contents);
    const secreto = PropertiesService.getScriptProperties().getProperty('SECRETO');
    if (!secreto || pedido.secreto !== secreto) return respuesta('no autorizado');
    const plantilla = TEXTOS[pedido.evento];
    if (!plantilla) return respuesta('evento desconocido');
    const d = pedido.datos || {};
    const t = plantilla(d);
    const destinatario = d.email || d.contacto_email;
    if (t.asunto && destinatario) enviar(destinatario, t.asunto, t.cuerpo);
    if (t.aviso) enviar(casillaAvisos(), '[Festival] ' + t.aviso, t.avisoCuerpo || '');
    return respuesta('ok');
  } catch (err) {
    console.error(err);
    return respuesta('error: ' + err);
  }
}

function doGet() { return respuesta('Mails del Festival de Solsticio: funcionando 🌿'); }

/** Para probar desde el editor: Ejecutar → probar */
function probar() {
  const t = TEXTOS.prueba();
  enviar(casillaAvisos(), '[Festival] ' + t.aviso, t.avisoCuerpo);
}

function enviar(para, asunto, html) {
  if (!para || !/@/.test(para)) return;
  GmailApp.sendEmail(para, asunto, html.replace(/<[^>]+>/g, '').replace(/\n\s+/g, '\n').trim(), {
    htmlBody: envoltorio(html), name: FIRMA,
  });
}

function casillaAvisos() {
  return PropertiesService.getScriptProperties().getProperty('AVISO_EMAIL') || Session.getEffectiveUser().getEmail();
}

function respuesta(t) { return ContentService.createTextOutput(t); }

// ---------- ayudas de formato ----------
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function nombre(s) { return esc(String(s || '').trim().split(' ')[0] || ''); }
function pesos(n) { return n == null ? '—' : '$ ' + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
function ig(u) { return u ? '@' + u + ' (instagram.com/' + u + ')' : null; }
function boton(url, texto) {
  return `<p style="margin:20px 0"><a href="${url}" style="background:#2A4030;color:#ffffff;padding:12px 20px;border-radius:12px;text-decoration:none;font-weight:bold;display:inline-block">${esc(texto)}</a></p>`;
}
function lista(obj) {
  return '<table style="border-collapse:collapse">' + Object.keys(obj).filter((k) => obj[k] != null && obj[k] !== '')
    .map((k) => `<tr><td style="padding:4px 12px 4px 0;color:#2A4030;font-weight:bold;vertical-align:top">${esc(k)}</td><td style="padding:4px 0">${esc(obj[k])}</td></tr>`).join('') + '</table>';
}
function detalle(d) {
  const items = (d.items || []).map((i) => `<li>${i.cantidad} × ${esc(i.nombre)} · ${pesos(i.cantidad * i.precio_unit)}</li>`).join('');
  return items ? `<ul>${items}</ul><p><b>Total: ${pesos(d.total)}</b></p>` : '';
}
function envoltorio(html) {
  return `<div style="background:#F5F0EA;padding:24px;font-family:Arial,sans-serif;color:#2A4030;line-height:1.5">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:20px;padding:28px;border-top:8px solid #C38065">
      <p style="margin:0 0 16px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#C38065;font-weight:bold">Festival de Solsticio · Micelia</p>
      ${html}
    </div></div>`;
}
