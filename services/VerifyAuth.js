const verifyAuth = (req, permittedRoles = []) => {
  let isRolePermitted = permittedRoles.length>0?false:true;
  // check if any of user's roles match with permitted roles for this request
  if (req.session.roles) {
    let matchingRoles = req.session.roles?.filter((role) =>
      permittedRoles.includes(role)
    );
    if (matchingRoles.length > 0) {
      isRolePermitted = true;
    }
  } else {
    req.session.roles = [];
  }
  // check authentication status
  if (req.isAuthenticated()) {
    return {
      authenticated: true,
      username: req.user.username,
      roles: req.session.roles,
      rolePermitted: isRolePermitted,
    };
  } else {
    return {
      authenticated: false,
    };
  }
};

module.exports = verifyAuth;
