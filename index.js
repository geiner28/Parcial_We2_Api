const express = require('express');
const app = express();
const PDFDocument = require('pdfkit');

const { readFileSync ,escribirArchivo} = require('./file.js') 
const path = require('path');
const Joi = require('joi');
const moment = require('moment');

const fs = require('fs');
const { create } = require('domain');
const viewsPath = path.join(__dirname, 'src', 'views');
const publicPath = path.join(__dirname, 'src', 'public');
app.use(express.json()); 




// Middleware para servir archivos estáticos
app.use(express.static(publicPath));
const PORT = process.env.PORT || 3000;







// 4 punto Middleware para registrar las solicitudes HTTP en el archivo access_log.txt
app.use((req, res, next) => {
  const logLine = `${new Date().toISOString()} - ${req.method} ${req.url}\n`;

  // Agregar la línea al archivo access_log.txt
  fs.appendFile('access_log.txt', logLine, (err) => {
    if (err) {
      console.error('Error al escribir en el archivo access_log.txt:', err);
    }
  });

  next();
});





// Middleware para agregar created_at al cuerpo de la solicitud
const agregarCreatedAt = (req, res, next) => {
  if (!req.body.created_at) {
    req.body.created_at = moment().format('YYYY-MM-DD hh:mm');
  }
  next();
};










//2 punto  metodo para obtener todos los carros
app.get('/carros', (req, res) => {
  const carros = readFileSync('./db.json');

  // Verificar si se proporcionó un query parameter para filtrar los registros
  const filtro = req.query.filtro;
  const valor = req.query.valor;

  if (filtro) {
    // Filtrar los registros por el valor especificado en la propiedad indicada
    const carrosFiltrados = carros.filter(carro => carro[filtro] == valor);

    if (carrosFiltrados.length === 0) {
      // Si no se encuentran registros que coincidan con el filtro, enviar todos los registros
      res.send(carros);
    } else {
      // Si se encuentran registros que coinciden con el filtro, enviar los registros filtrados
      res.send(carrosFiltrados);
    }
  } else {
    // Si no se proporcionó un query parameter, enviar todos los registros
    res.send(carros);
  }
});






// 1 punto metodo para agregar un carro a la lista de carros y validar los datos de entrada con Joi  
// la peticion se debe mandar en este formaro http://localhost:3000/carros?filtro=marca&valor=toyota

app.post('/carro',agregarCreatedAt, (req, res) => {
  // Definir esquema Joi para validar los datos de entrada
  const schema = Joi.object({
      // Define las propiedades que esperas en el cuerpo de la solicitud y sus respectivas validaciones
      // Por ejemplo, si esperas propiedades 'marca', 'modelo' y 'año' en el cuerpo de la solicitud:
      marca: Joi.string().required(),
      modelo: Joi.string().required(),
      año: Joi.number().integer().min(1900).max((new Date()).getFullYear()).required(),
      created_at: Joi.string().required(),
      // Puedes agregar más validaciones según tus necesidades
  });

  // Validar los datos de entrada
  const { error, value } = schema.validate(req.body);

  // Si hay un error en la validación, responder con un error 400
  if (error) {
      res.status(400).send(error.details[0].message);
      return;
  }

  // Continuar con el resto del código si los datos son válidos
  const carro = value; // Usamos 'value' que contiene los datos validados

  // Leer la lista de carros desde el archivo
  const carros = readFileSync('./db.json');

  // Agregar el nuevo carro a la lista
  carro.id = carros.length + 1; // Asignamos un nuevo ID al carro
  carros.push(carro);

  // Escribir la lista de carros actualizada en el archivo
  escribirArchivo('./db.json', carros);

  // Responder con el carro agregado y un código de estado 201 (Created)
  res.status(201).send(carro);
});

















//    1 punto metodo para actualizar un carro por id y validar los datos de entrada con Joi
app.put('/carro/:id', agregarCreatedAt,(req, res) => {
  const id = req.params.id;

  // Definir esquema Joi para validar los datos de entrada
  const schema = Joi.object({
      // Aquí defines las propiedades que esperas en el cuerpo de la solicitud y sus respectivas validaciones
      // Por ejemplo, si esperas una propiedad 'marca' en el cuerpo de la solicitud:
      marca: Joi.string().required(),
      modelo: Joi.string().required(),
      año: Joi.number().integer().min(1900).max((new Date()).getFullYear()).required(),
      created_at: Joi.string().required(),
      // Puedes agregar más validaciones según tus necesidades
  });

  // Validar los datos de entrada
  const { error, value } = schema.validate(req.body);

  // Si hay un error en la validación, responder con un error 400
  if (error) {
      res.status(400).send(error.details[0].message);
      return;
  }

  // Continuar con el resto del código si los datos son válidos
  const carros = readFileSync('./db.json');
  const carro = carros.find(carro => carro.id === parseInt(id));

  // Si no existe el carro
  if (!carro) {
      res.status(404).send('El carro no existe');
      return;
  }

  // Actualizar el carro
  const index = carros.indexOf(carro);
  const carroActualizado = { ...carro, ...value }; // Usamos 'value' que contiene los datos validados
  carros[index] = carroActualizado;

  // Escribir en el archivo
  escribirArchivo('./db.json', carros);
  res.send(carroActualizado);
});






// 3 punto metodo para actualizar el campo 'updated_at' en todos los registros
app.put('/carros/actualizar', (req, res) => {
  const carros = readFileSync('./db.json');

  // Obtener la fecha y hora actual en formato YYYY-MM-DD hh:mm
  const fechaActual = moment().format('YYYY-MM-DD hh:mm');

  // Recorrer todos los registros y actualizar el campo 'updated_at' si está vacío
  const carrosActualizados = carros.map(carro => {
    if (!carro.updated_at) {
      carro.updated_at = fechaActual;
    }
    return carro;
  });

  // Escribir en el archivo
  escribirArchivo('./db.json', carrosActualizados);

  res.send(carrosActualizados);
});
// como mandar la peticion http://localhost:3000/carros/actualizar





//metodo para eliminar un carro por id
app.delete('/carro/:id', (req, res) => {
  const id = req.params.id
  const carros = readFileSync('./db.json')
  const carro = carros.find(carro => carro.id === parseInt (id))
  const index = carros.indexOf(carro)
  if (!carro){
      res.status(404).send('El carro no existe')
      return
  }
  carros.splice(index, 1)
  escribirArchivo('./db.json', carros)
  res.send("el carro"+ id + "fue eliminado")

})
















// Función para generar un documento PDF a partir de un arreglo de carros
function generarPDF(carros) {
  return new Promise((resolve, reject) => {
      // Crea un nuevo documento PDF
      const doc = new PDFDocument();
      const buffers = [];
    
      // Captura los datos del PDF en un buffer
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          resolve(pdfData);
      });

      // Agrega contenido al PDF
      doc.fontSize(18).text('Lista de Carros', { align: 'center' }).moveDown();
      carros.forEach((carro, index) => {
          doc.fontSize(12).text(`Carro ${index + 1}: ${JSON.stringify(carro)}`).moveDown();
      });

      // Cierra el documento PDF
      doc.end();
  });
}

// Ruta GET para obtener el PDF con la lista de carros
app.get('/lista_carros.pdf', async (req, res) => {
  try {
      // Lee los carros desde el archivo JSON
      const carros = readFileSync('./db.json');

      // Genera el PDF en memoria
      const pdfData = await generarPDF(carros);

      // Configura los encabezados de la respuesta HTTP
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename="lista_carros.pdf"');

      // Envía el PDF como respuesta HTTP
      res.end(pdfData);
  } catch (error) {
      console.error('Error al generar el PDF:', error);
      res.status(500).send('Error al generar el PDF');
  }
});



app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});



