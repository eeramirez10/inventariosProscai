let controller = {};
let { response } = require('express');
const query = require('../connection/tuvansaConnection');


controller.getUpdateUsuarios = async (req, res) => {

    let user = req.body;



    if (user.action === "edit") {

        let { action, id, ...data } = user;



        let usuarios = await query('UPDATE usuario set ? where id = ?', [data, id])
 

        return res.json({
            ok: true,
            message:'Usuario Actualizado'

        })

    }

    let usuarios = await query(`
    select u.id, u.nombre, u.apellido, u.user, u.upload,DATE_FORMAT(u.fecha_alta,"%Y-%m-%d") as fecha_alta , a.area, s.sucursal, r.rol  from usuario as u
    inner join area as a on a.idArea = u.idArea
    inner join sucursal as s on s.idSucursal = u.idSucursal
    inner join rol as r on r.idRol = u.idRol`);

    res.json({
        ok: true,
        data: usuarios
    })



}

module.exports = controller;