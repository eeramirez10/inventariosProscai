const controller = {};

const passport = require('passport');
const passportLocal = require('passport-local').Strategy;

const query = require('../connection/tuvansaConnection');

const { types } = require('../helpers/rolRuta')


passport.use(new passportLocal( async  (username, password, done) =>  {

    try {

        const queryUsuarios = `SELECT u.id,u.nombre, u.user,u.apellido,u.upload, a.area, r.rol,s.sucursal from usuario as u
        inner join area as a on u.idArea = a.idArea
        inner join rol as r on u.idRol = r.idRol
        inner join sucursal as s on u.idSucursal = s.idSucursal
        where user = ? && password = ?`;
    
        let usuarios = await query(queryUsuarios,[username, password])

            if (usuarios.length > 0){

                const { id,nombre,apellido, user, area, rol,upload, sucursal } = usuarios[0];


                return done(null,
                    {
                        idUsuario: id,      
                        nombre: nombre,
                        apellido: apellido,
                        user: user,
                        area: area,
                        rol: rol,
                        upload: upload,
                        sucursal: sucursal
                    }
                );
        
            }
        
            return done(null, false, { message: 'Usuario o password incorrecto' });
        
    } catch (error) {

        console.log(error);

        return res.status(500).json({
            ok:false,
            message:'Hubo un error recisar con el desarrollador'
        })
        
    }


}))

passport.serializeUser((user, done) => {
    done(null, user)
})

passport.deserializeUser((user, done) => {
    done(null, user)
})




controller.login = (req, res, next) => {

    
    if (req.isAuthenticated()) {

        let { rol } = req.user;
        
        return res.redirect(types[rol]);
    }
    res.render('login');


}

controller.loginPost = passport.authenticate('local',{failureRedirect:'/',failureFlash: true });


module.exports = controller;