const verifyAuth = require("../services/verifyAuth");

exports.ServeIndex = function(req,res,next){
    const isAuth = verifyAuth(req);
    res.render("index",{title:"Express Billing Project: Home",header:isAuth?"userHeader":"genHeader"});
    next();
}