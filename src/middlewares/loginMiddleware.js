
const login = {};

login.isAuthenticated = (req, res, next)=>{
   
    if (req.isAuthenticated()) return next();
    res.redirect('/');


}

login.isCertificado = (req, res, next)=>{

    if(req.user.rol !== 'administrador' && req.user.rol !== 'certificado' ) return res.redirect('/');
   
    next();
}

login.isAdmin = (req, res, next)=>{
    if(req.user.rol !== 'administrador') return res.redirect('/');
   
    next();
}

module.exports = login;