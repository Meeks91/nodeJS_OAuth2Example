let userDBHelper

module.exports = injectedUserDBHelper => {

  userDBHelper = injectedUserDBHelper

  return {
    registerUser: registerUser,
    login: login
  }
}

/* handles the api call to register the user and insert them into the users table.
  The req body should contain a username and password. */
function registerUser(req, res){

    console.log(`authRoutesMethods: registerUser: req.body is:`, req.body);

    //query db to see if the user exists already
    userDBHelper.doesUserExist(req.body.username, (sqlError, doesUserExist) => {

      //check if the user exists
      if (sqlError !== null || doesUserExist){

        //message to give summary to client
        const message = sqlError !== null ? "Operation unsuccessful" : "User already exists"

        //detailed error message from callback
        const error =  sqlError !== null ? sqlError : "User already exists"

        sendResponse(res, message, sqlError)

        return
      }

      //register the user in the db
      userDBHelper.registerUserInDB(req.body.username, req.body.password, dataResponseObject => {

        //create message for the api response
        const message =  dataResponseObject.error === null  ? "Registration was successful" : "Failed to register user"

        sendResponse(res, message, dataResponseObject.error)
      })
    })
  }




function login(registerUserQuery, res){


}

//sends a response created out of the specified parameters to the client.
//The typeOfCall is the purpose of the client's api call
function sendResponse(res, message, error) {

        res
        .status(error !== null ? error !== null ? 400 : 200 : 400)
        .json({
             'message': message,
             'error': error,
        })
}
