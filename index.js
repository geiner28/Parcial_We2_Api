const express = require('express');
const app = express();
const PDFDocument = require('pdfkit');
const fs = require('fs')
const { readFileSync ,escribirArchivo} = require('./file') 

// Resto del código de tu aplicación

const PORT = process.env.PORT || 3000;
app.use(express.json());




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
      return
  }
  //existe
  res.send(carro)
  
  })

//metodo para agregar un carro a la lista de cas

app.post('/carro', (req, res) => {
  const carro = req.body
  const carros = readFileSync('./db.json') 
  carro.id = carros.length + 1    
  carros.push(carro)
  //escribir arcihvo  
  escribirArchivo('./db.json', carros)
  res.status(201).send(carros)


})


//metodo para actualizar un carro por id
app.put('/carro/:id', (req, res) => {
  const id = req.params.id
  const carros = readFileSync('./db.json')
  const carro = carros.find(carro => carro.id === parseInt (id))
  if (!carro){
      res.status(404).send('El carro no existe')
      return
  }
  const index = carros.indexOf(carro)
  const carroActualizado = req.body
  carros[index] = carroActualizado
  escribirArchivo('./db.json', carros)
  res.send(carroActualizado)
})



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



