let controller = {};
let { response } = require('express');
const query = require('../connection/tuvansaConnection');

let { table } = require('../helpers/tableServerPro')


controller.actualizar = async (req, res) => {

    let user = req.body;
    

    try {


        let { action, id, ...data } = user;



        if (action === 'delete'){

            await query('delete from usuario where id = ?', id);

            return res.json({
                ok:true,
                message:'Borrado corrctamente'
            });

        }



        let usuarios = await query('UPDATE usuario set ? where id = ?', [data, id])


        return res.json({
            ok: true,
            message: 'Usuario Actualizado'

        })

    } catch (error) {
        console.log(error)

        return res.status(500).json({
            ok: false,
            message: 'Hubo un error, revisar logs'
        })
    }








}


controller.usuarios = async (req, res) => {

    let sTable = 'usuario as u';

    var aColumns = [
        "u.id as id",
        'u.nombre as nombre',
        "u.apellido as apellido",
        "u.user as user",
        "u.password as password",
        "u.upload as upload",
        'DATE_FORMAT(u.fecha_alta,"%Y-%m-%d") as fecha_alta',
        'a.area as area',
        "s.sucursal as sucursal",
        "r.rol as rol"
    ];

    const sjoin = `
        inner join area as a on a.idArea = u.idArea
        inner join sucursal as s on s.idSucursal = u.idSucursal
        inner join rol as r on r.idRol = u.idRol
    `;

    let resp = await table(sTable, aColumns, sjoin, '', 'Tuvansa', req)


    res.status(200).send(resp);

}

controller.usuarioNuevo = async (req, res) => {

    let { ...usuario } = req.body;

    

    try {

        let buscaUsuario = await query('Select * from usuario where user = ?', usuario.user);



        if(buscaUsuario.length > 0){

            return res.status(400).json({ 
                ok:false,
                message:'Ese usuario ya esta registrado'
            })
        }

        let usuarioDB = await query('Insert into usuario set ?', usuario)
            

            res.status(200).json({
                ok: true,
                message: 'Usuario Creado correctamente'
              

            })

    } catch (err) {
        console.log(err)
        res.status(500).json({
            ok: false,
            message: 'Hubo un error. revisar logs'
        })
    }



}

module.exports = controller;