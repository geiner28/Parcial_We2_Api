const express = require('express');
const app = express();
const PDFDocument = require('pdfkit');
const fs = require('fs')
const { readFileSync ,escribirArchivo} = require('./file.js') 
const path = require('path');
const Joi = require('joi');

const viewsPath = path.join(__dirname, 'src', 'views');
const publicPath = path.join(__dirname, 'src', 'public');


app.use(express.json());

// Middleware para servir archivos estáticos
app.use(express.static(publicPath));
const PORT = process.env.PORT || 3000;
// Ruta para manejar la petición GET a la raíz del servidor
app.get('/', (req, res) => {
  // Envía la respuesta con el contenido HTML
  res.sendFile(path.join(viewsPath, 'index.html'));
});


//metodo para obtener todos los carros
app.get('/carros', (req, res) => {  
  const carros = readFileSync('./db.json')
  res.send(carros)
})


// metodo para obtener informacion de un carro por id
app.get('/carros/:id', (req, res) => {
  const id = req.params.id
  const carros = readFileSync('./db.json')
  const carro = carros.find(carro => carro.id === parseInt (id))
  
  //no existe
  if (!carro){
      res.status(404).send('El carro no existe')
      returnn
  }
  //existe
  res.send(carro)
  
  })





// 1 punto metodo para agregar un carro a la lista de carros y validar los datos de entrada con Joi  
app.post('/carro', (req, res) => {
  // Definir esquema Joi para validar los datos de entrada
  const schema = Joi.object({
      // Define las propiedades que esperas en el cuerpo de la solicitud y sus respectivas validaciones
      // Por ejemplo, si esperas propiedades 'marca', 'modelo' y 'año' en el cuerpo de la solicitud:
      marca: Joi.string().required(),
      modelo: Joi.string().required(),
      año: Joi.number().integer().min(1900).max((new Date()).getFullYear()).required(),
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
app.put('/carro/:id', (req, res) => {
  const id = req.params.id;

  // Definir esquema Joi para validar los datos de entrada
  const schema = Joi.object({
      // Aquí defines las propiedades que esperas en el cuerpo de la solicitud y sus respectivas validaciones
      // Por ejemplo, si esperas una propiedad 'marca' en el cuerpo de la solicitud:
      marca: Joi.string().required(),
      modelo: Joi.string().required(),
      año: Joi.number().integer().min(1900).max((new Date()).getFullYear()).required(),
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



