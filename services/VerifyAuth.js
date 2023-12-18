const verifyAuth = (req, permittedRoles = []) => {
  let isRolePermitted = false;
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
