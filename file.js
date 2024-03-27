const e = require('express');
const fs=require('fs');

function readFileSync(path){    
    const data=fs.readFileSync(path);
    const carros=JSON.parse(data).carros;
    return carros;   }



function escribirArchivo(path, info){ 
    const data=JSON.stringify({'carros':info});
    fs.writeFileSync(path, data);

}
   
  
   module.exports = {readFileSync, escribirArchivo}



