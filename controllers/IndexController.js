exports.ServeIndex = function(req,res,next){
    res.render("index",{title:"Express Billing Project: Home"});
    next();
}