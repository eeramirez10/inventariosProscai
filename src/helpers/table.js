

let sIndexColumn = '*';
let sTable = 'producto_coladas';
var request = {};
var aColumns = [
    "pc.idProductoColadas as ID",
    'DATE_FORMAT(pc.fecha,"%Y-%m-%d") as Alta',
    "prod.codigo as Codigo",
    "prod.iean as EAN",
    "prod.descripcion as Descripcion",
    "col.colada as Colada",
    'DATE_FORMAT(doc.fecha,"%Y-%m-%d") as Fecha',
    "cer.descripcion as Certificado",
    "doc.entrada as Entrada",
    "doc.orden as Orden",
    "prov.nombre as Proveedor",
];


let dataTableServerProccess = ()=>{



}