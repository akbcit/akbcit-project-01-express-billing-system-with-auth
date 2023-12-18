const verifyAuth = require("../services/verifyAuth");

exports.ServeIndex = function(req,res,next){
    const authInfo = verifyAuth(req);
    console.log(authInfo);
    res.render("index",{title:"Express Billing Project: Home",authInfo:authInfo});
    next();
}