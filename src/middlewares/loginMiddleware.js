
const login = {};

login.isAuthenticated = (req, res, next)=>{
   
    if (req.isAuthenticated()) return next();
    res.redirect('/');

}

module.exports = login;