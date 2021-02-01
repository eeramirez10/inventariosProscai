const controller = {};

const passport = require('passport');
const passportLocal = require('passport-local').Strategy;

const query = require('../connection/tuvansaConnection');




passport.use(new passportLocal( async  (username, password, done) =>  {



    const queryUsuarios = `SELECT u.id,u.nombre, u.user,u.apellido,u.upload, a.area, r.rol,s.sucursal from usuario as u
    inner join area as a on u.idArea = a.idArea
    inner join rol as r on u.idRol = r.idRol
    inner join sucursal as s on u.idSucursal = s.idSucursal
    where user = ? && password = ?`

    let usuarios = await query(queryUsuarios,[username, password])
        .catch( err => err);

        console.log(usuarios)

    if (usuarios.length > 0){

        return done(null,
            {
                idUsuario: usuarios[0].id,      
                nombre: usuarios[0].nombre,
                apellido: usuarios[0].apellido,
                user: usuarios[0].user,
                area: usuarios[0].area,
                rol: usuarios[0].rol,
                upload: usuarios[0].upload,
                sucursal: usuarios[0].sucursal
            }
        );

    }

    return done(null, false, { message: 'Usuario o password incorrecto' });

/*     connection.query(queryUsuarios,[username, password],(err, results)=>{

        if (err) throw err;
       console.log(results) 
        if (results.length > 0 ){
            return done(null,
                {
                    idUsuario: results[0].id,
                    nombre: results[0].nombre,
                    apellido: results[0].apellido,
                    user: results[0].user,
                    area: results[0].area,
                    rol: results[0].rol,
                    upload: results[0].upload,
                    sucursal: results[0].sucursal
                }
            );

            
        }

       return done(null, false, { message: 'Usuario o password incorrecto' });
    }) */

    

}))

passport.serializeUser((user, done) => {
    done(null, user)
})

passport.deserializeUser((user, done) => {
    done(null, user)
})




controller.login = (req, res, next) => {


    if (req.isAuthenticated()) {
        return res.redirect('/inventarios');
    }
    res.render('login');


}

controller.loginPost = passport.authenticate('local', {
    failureRedirect: '/',
    successRedirect: '/inventarios',
    failureFlash: true

})


module.exports = controller;