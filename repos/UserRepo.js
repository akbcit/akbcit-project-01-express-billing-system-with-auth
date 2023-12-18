const User = require("../models/User");

class UserRepo {
  // method to fetch user details
  async getUserDetails(username, fieldsArray) {
    console.log(
      `Fetching details for ${fieldsArray} for user ${username} from the database!`
    );

    const projection = fieldsArray.reduce(
      (proj, field) => ({ ...proj, [field]: 1 }),
      {}
    );
    // find user
    try {
      const userDetails = await User.findOne(
        { username: username },
        projection
      );

      if (userDetails) {
        console.log(userDetails);
        return userDetails;
      } else {
        return false;
      }
    } catch (err) {
      console.log(err.message);
      return false;
    }
  }
  async getUserByUsername(username){
    try{
      console.log(`Getting user: ${username} from database`)
      const user = User.findOne({username:username});
      return user;
    }
    catch(err){
      console.log(`Unable to find user with username: ${username}`);
      return false;
    }
  }
}

module.exports = UserRepo;
