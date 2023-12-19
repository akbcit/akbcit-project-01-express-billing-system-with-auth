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
  // method to get user by username
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
  // method to get all users
  async getAllUsers(sortOrder={firstName:1,lastName:1}){
    try{
      const users = await User.find({}).sort(sortOrder);
      return users;
    }catch(err){
      console.log(`Error while fetching users from database: ${err.message}`);
      return false;
    }
  }
  // method to get users who are clients
  async getAllClients(sortOrder={firstName:1,lastName:1,"clientDetails.company":1}){
    try{
      const clients = await User.find({"clientDetails.isClient":true}).sort(sortOrder);
      return clients;
    }catch(err){
      console.log(`Error while fetching clients from database: ${err.message}`);
      return false;
    }
  }
}

module.exports = UserRepo;
