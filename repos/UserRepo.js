const User = require("../models/User");

class UserRepo {
// method to fetch user details 
  async getUserDetails(id, details) {
    console.log(`Fetching details for user ${id} from database!`);
    const detailsObj = {
      _id: details.includes("id"),
      username: details.includes("username"),
      email: details.includes("email"),
      firstName: details.includes("firstName"),
      lastName: details.includes("lastName"),
    };
    // find user
    const userDetails = await User.findOne(
      { _id: id },
      detailsObj
    );
    if(userDetails){
        return userDetails
    }
    else{
        return false;
    }
  }
}

module.exports = UserRepo;