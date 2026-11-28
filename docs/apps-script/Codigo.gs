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
const CANAL_TELEGRAM = 'https://t.me/miceliacomunidad/85';
// Base de datos (la clave publicable es pública; la seguridad la da el SECRETO)
const SUPABASE_URL = 'https://yaarirnpxdvzmyzjtjws.supabase.co';
const SUPABASE_KEY = 'sb_publishable_d41nHH3n1IOn2iAQFWNAXQ_V4Kodm0Z';
const ALERTA_INSCRIPTAS = 70;

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
      <p>Te recomendamos guardar ese link y elegir un momento del día para tu práctica.
      Y sumate al canal de Telegram, donde te vamos avisando cada día:</p>
      ${boton(CANAL_TELEGRAM, 'Sumate al Canal de Respira y Transfórmate')}
      <p>Y guardá esta fecha: el <b>sábado 19 de diciembre</b> cerramos el ciclo celebrando
      en comunidad en el <b>Festival de Solsticio</b>. Muy pronto te contamos más.</p>
      <p>Con gratitud,<br>${FIRMA}</p>`,
    aviso: `Nueva inscripta al desafío: ${d.nombre}`,
    avisoCuerpo: lista({ Nombre: d.nombre, Email: d.email, WhatsApp: d.whatsapp, Instagram: ig(d.instagram),
      Ciudad: d.ciudad, '¿Cómo se enteró?': d.como_se_entero, 'Total de inscriptas': d.total_inscriptas }),
  }),

  marca_postulacion: (d) => {
    const nivel = campo(d.mensaje, 'Nivel');
    const pago = campo(d.mensaje, 'Pago');
    const deFormNivel = /formulario de nivel/i.test(d.mensaje || '');
    const aliasM = (pago || '').match(/alias\s+(\S+)/i);
    const montoM = (pago || '').match(/\$\s?[\d.]+/);
    const plazoM = (pago || '').match(/\(([^)]+)\)\s*$/);
    return {
    para: emailDe(d.contacto),
    asunto: deFormNivel && nivel && nivel !== 'a definir' ? `¡Gracias por sumarte como ${nivel} al Festival de Solsticio! 🌿` : 'Recibimos tu postulación al Festival de Solsticio 🌿',
    cuerpo: `
      <p>¡Hola ${nombre(d.contacto)}!</p>
      <p>Recibimos los datos de <b>${esc(d.nombre)}</b>${deFormNivel && nivel ? ` para sumarse como <b>nivel ${esc(nivel)}</b>` : ''}
      al <b>Festival de Solsticio</b> del sábado 19 de diciembre. ¡Gracias!</p>
      ${pago ? `
        <p><b>Para confirmar tu lugar</b>, transferí <b>${montoM ? montoM[0] : ''}</b> al alias
        <b>${aliasM ? esc(aliasM[1]) : ''}</b> (Mercado Pago de Micelia) dentro de las <b>${plazoM ? esc(plazoM[1]) : '24 hs'}</b>.</p>
        <p>En el concepto poné el nombre de tu marca, y mandanos el comprobante <b>respondiendo este mail</b>.</p>`
      : `<p>El equipo de Alianzas de Micelia te va a escribir para coordinar los próximos pasos.</p>`}
      <p>Mientras tanto podés releer la propuesta completa acá:</p>
      ${boton(SITIO + '/marcas-aliadas', 'Ver la propuesta')}
      <p>Con gratitud,<br>${FIRMA}</p>`,
    aviso: `Nueva postulación${nivel ? ' (' + nivel + ')' : ''}: ${d.nombre}`,
    avisoCuerpo: lista({ Marca: d.nombre, Rubro: d.rubro, Instagram: ig(d.instagram), WhatsApp: d.whatsapp,
      Contacto: d.contacto, Descripción: d.descripcion, Mensaje: d.mensaje }) + boton(SITIO + '/panel/marcas', 'Ver en el panel'),
    };
  },

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

  // Mail diario del Desafío (lo manda enviarDesafioDiario a las 6 am)
  desafio_dia: (dia, nombrePersona) => ({
    asunto: `🌿 Día ${dia.dia} del Desafío de Gratitud: ya está disponible`,
    cuerpo: `
      <p>¡Buen día, ${nombre(nombrePersona)}!</p>
      <p>Ya podés ver el video del <b>Día ${dia.dia}</b>${dia.titulo && !/^d[ií]a \d+$/i.test(dia.titulo) ? `: <b>${esc(dia.titulo)}</b>` : ''}.</p>
      ${dia.descripcion ? `<p>${esc(dia.descripcion)}</p>` : ''}
      ${boton(SITIO + '/desafio', 'Ver el video de hoy')}
      <p>Elegí un momento tranquilo del día para tu práctica 💜</p>
      ${boton(CANAL_TELEGRAM, 'Canal de Respira y Transfórmate en Telegram')}
      <p>Con gratitud,<br>${FIRMA}</p>
      <p style="font-size:12px;color:#888">Si no querés recibir más estos mails, respondé con la palabra BAJA.</p>`,
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
    const destinatario = t.para || d.email || d.contacto_email;
    if (t.asunto && destinatario) enviar(destinatario, t.asunto, t.cuerpo);
    if (t.aviso) enviar(casillaAvisos(), '[Festival] ' + t.aviso, t.avisoCuerpo || '');
    return respuesta('ok');
  } catch (err) {
    console.error(err);
    return respuesta('error: ' + err);
  }
}

function doGet() { return respuesta('Mails del Festival de Solsticio: funcionando 🌿'); }

// ======================= MAIL DIARIO DEL DESAFÍO =======================

/** Lo ejecuta el activador todos los días a las 6 am. */
function enviarDesafioDiario() {
  const secreto = PropertiesService.getScriptProperties().getProperty('SECRETO');
  const datos = llamarSupabase('desafio_pendientes_hoy', { p_secreto: secreto, p_limite: 90 });
  avisarSiHayMuchas(datos.total_inscriptas);
  if (!datos.dia) { console.log('Hoy no hay día publicado con video.'); return; }
  const cupo = Math.max(MailApp.getRemainingDailyQuota() - 10, 0);   // dejamos lugar para avisos y compras
  const enviados = [];
  for (const p of datos.pendientes.slice(0, cupo)) {
    try {
      const t = TEXTOS.desafio_dia(datos.dia, p.nombre);
      enviar(p.email, t.asunto, t.cuerpo);
      enviados.push(p.id);
    } catch (err) { console.error('No se pudo enviar a ' + p.email, err); }
  }
  if (enviados.length) llamarSupabase('desafio_marcar_enviados', { p_secreto: secreto, p_dia: datos.dia.dia, p_ids: enviados });
  const faltan = datos.pendientes.length - enviados.length;
  console.log(`Día ${datos.dia.dia}: enviados ${enviados.length}, sin enviar ${faltan}`);
  if (faltan > 0) enviar(casillaAvisos(), `[Festival] ⚠️ Mail del desafío: faltaron ${faltan} por el límite diario de Gmail`,
    '<p>Hoy no alcanzó el cupo de Gmail para mandar el mail del desafío a todas. Hay que ver otra forma de envío.</p>');
}

/** Ejecutar UNA sola vez: programa el envío diario a las 6 am (hora de Mendoza). */
function instalarEnvioDiario() {
  ScriptApp.getProjectTriggers().filter((t) => t.getHandlerFunction() === 'enviarDesafioDiario').forEach((t) => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('enviarDesafioDiario').timeBased().everyDays(1).atHour(6).nearMinute(0)
    .inTimezone('America/Argentina/Mendoza').create();
  console.log('Listo: el mail del desafío sale todos los días entre las 6 y las 7 am.');
}

/** Para ver cómo queda: manda el mail del día de hoy SOLO a la casilla de avisos (no a las inscriptas). */
function probarDesafioDiario() {
  const secreto = PropertiesService.getScriptProperties().getProperty('SECRETO');
  const datos = llamarSupabase('desafio_pendientes_hoy', { p_secreto: secreto, p_limite: 0 });
  const dia = datos.dia || { dia: 1, titulo: 'Ejemplo', descripcion: 'Hoy no hay un día publicado con video: esto es un ejemplo.' };
  const t = TEXTOS.desafio_dia(dia, 'Micelia');
  enviar(casillaAvisos(), '[PRUEBA] ' + t.asunto, t.cuerpo);
  console.log('Inscriptas: ' + datos.total_inscriptas + ' · Día de hoy: ' + (datos.dia ? datos.dia.dia : 'ninguno publicado'));
}

function avisarSiHayMuchas(total) {
  const props = PropertiesService.getScriptProperties();
  if (total >= ALERTA_INSCRIPTAS && !props.getProperty('ALERTA_ENVIADA')) {
    enviar(casillaAvisos(), `[Festival] 📣 Ya hay ${total} inscriptas al desafío`,
      `<p>Llegaron a ${total} inscriptas. El Gmail de Micelia manda unos 100 mails por día: conviene ver cómo seguimos con el mail diario.</p>`);
    props.setProperty('ALERTA_ENVIADA', 'si');
  }
}

function llamarSupabase(funcion, args) {
  const r = UrlFetchApp.fetch(SUPABASE_URL + '/rest/v1/rpc/' + funcion, {
    method: 'post', contentType: 'application/json', payload: JSON.stringify(args), muteHttpExceptions: true,
    headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY },
  });
  if (r.getResponseCode() >= 300) throw new Error(funcion + ': ' + r.getResponseCode() + ' ' + r.getContentText());
  return JSON.parse(r.getContentText());
}

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
/** Valor de una línea "Clave: valor" dentro de un texto. */
function campo(texto, clave) {
  const m = String(texto || '').match(new RegExp('^' + clave + ':\\s*(.+)$', 'mi'));
  return m ? m[1].trim() : null;
}
function emailDe(texto) {
  const m = String(texto || '').match(/[^\s@·]+@[^\s@·]+\.[^\s@·]+/);
  return m ? m[0] : null;
}
function nombre(s) { return esc(String(s || '').trim().split(/[\s·]+/)[0] || ''); }
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
