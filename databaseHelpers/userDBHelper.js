let mySqlConnection;

module.exports = injectedMySqlConnection => {

  mySqlConnection = injectedMySqlConnection

  return {

   registerUserInDB: registerUserInDB,
   getUserFromCrentials: getUserFromCrentials,
   doesUserExist: doesUserExist
 }
}

/* attempts to register a user in the DB with the specified details.
it provides the results in the specified callback which takes a
dataResponseObject as its only parameter */
function registerUserInDB(username, password, registrationCallback){

  //create query using the data in the req.body to register the user in the db
  const registerUserQuery = `INSERT INTO users (username, user_password) VALUES ('${username}', SHA('${password}'))`

  //execute the query to register the user
  mySqlConnection.query(registerUserQuery, registrationCallback)
}

/* Gets the user with the specified username and password.
It provides the results in a callback which takes 2 parameters:
1. An error object which will be set to null if there is no error.
2. A user object which will be null if there is no user  */
function getUserFromCrentials(username, password, callback) {

  //create query using the data in the req.body to register the user in the db
  const getUserQuery = `SELECT * FROM users WHERE username = '${username}' AND user_password = SHA('${password}')`

  console.log('getUserFromCrentials query is: ', getUserQuery);

  //execute the query to get the user
  mySqlConnection.query(getUserQuery, (dataResponseObject) => {

    console.log('getUserFromCrentials: dataResponseObject is: ', dataResponseObject);

      //pass in the error which may be null and pass the results object which we get the user from if it is not null
      callback(false, dataResponseObject.results !== null && dataResponseObject.results.length  === 1 ?  dataResponseObject.results[0] : null)
  })
}

/* Determines whether or not user with the specified userName exists.
 It provides the results in a callback which takes 2 parameters:
 1. An error object which will be set to null if there is no error.
 2. A boolean value which says whether or the user exists. It's set to true if the user exists else it's set to false
    or it will be null if the results object is null
   */
function doesUserExist(username, callback) {

  //create query to check if the user already exists
  const doesUserExistQuery = `SELECT * FROM users WHERE username = '${username}'`

  //holds the results  from the query
  const sqlCallback = (dataResponseObject) => {

    console.log('doesUserExist: dataResponseObject is: ${dataResponseObject}');

      //calculate if user exists or assign null if results is null
      const doesUserExist = dataResponseObject.results !== null ? dataResponseObject.results.length > 0 ? true : false : null

      //check if there are any users with this username and return the appropriate value
      callback(dataResponseObject.error, doesUserExist)
  }

  //execute the query to check if the user exists
  mySqlConnection.query(doesUserExistQuery, sqlCallback)
}
