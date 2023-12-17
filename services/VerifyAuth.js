const verifyAuth=(req)=>{
    if(req.isAuthenticated()){
        return req.user;
    }
    else{
        return false;
    }
}