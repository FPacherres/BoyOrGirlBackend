const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 8000; // usa el puerto de Render si existe

const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');

dayjs.extend(utc);

app.use(cors());
app.use(express.json());

// Ruta SSE
app.get('/eventos', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  if (!fechaObjetivo) return res.end();

  res.write(`data: ${JSON.stringify({
    tipo: 'reloj',
    fechaObjetivo,
  })}\n\n`);

  // Calcular cuánto falta en ms hasta la fechaObjetivo
  const fecha = new Date(fechaObjetivo);
  const ahora = new Date();
  const msRestantes = fecha.getTime() - ahora.getTime();

  if (msRestantes <= 0) {
    // Si ya pasó, enviar de inmediato
    res.write(`data: ${JSON.stringify({
      tipo: 'resultado',
      genero: resultado
    })}\n\n`);
  } else {
    // Esperar el tiempo restante
    setTimeout(() => {
      res.write(`data: ${JSON.stringify({
        tipo: 'resultado',
        genero: resultado
      })}\n\n`);
    }, msRestantes);
  }
});


let resultado = null; // valor que guardaremos (puede ser 'niño' o 'niña')

app.post('/registrar-genero', express.json(), (req, res) => {
  const { genero } = req.body;

  if (genero !== 'niño' && genero !== 'niña') {
    return res.status(400).json({ message: 'Género inválido' });
  }

  resultado = genero;
  res.json({ message: 'Género registrado correctamente' });
});

// También deberías exponer este resultado con un GET
app.get('/resultado', (req, res) => {
  if (!resultado) {
    return res.status(404).json({ message: 'Resultado aún no disponible' });
  }

  res.json({ genero: resultado });
});

let fechaObjetivo = null;

// POST: guardar la fecha
app.post('/fecha-objetivo', (req, res) => {
  const { fecha } = req.body;

  // Asegúrate que `fecha` sea un string en formato ISO
  const fechaUTC = dayjs.utc(fecha);

  if (!fechaUTC.isValid()) {
    return res.status(400).json({ message: 'Fecha inválida' });
  }

  fechaObjetivo = fechaUTC.toDate(); // Convertimos a Date nativa para usar en otros lados
  console.log('Fecha objetivo registrada:', fechaObjetivo.toISOString());

  res.json({ message: 'Fecha registrada correctamente', fecha: fechaObjetivo });
});

// GET: devolver la fecha
app.get('/fecha-objetivo', (req, res) => {
  if (!fechaObjetivo) {
    return res.status(404).json({ message: 'Aún no hay fecha guardada' });
  }

  res.json({ fecha: fechaObjetivo });
});


app.listen(PORT, () => {
  console.log(`Servidor SSE corriendo en http://localhost:${PORT}`);
});