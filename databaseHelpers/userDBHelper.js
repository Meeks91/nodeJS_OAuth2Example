let mySqlConnection;

module.exports = injectedMySqlConnection => {

  mySqlConnection = injectedMySqlConnection

  return {
   registerUserInDB,
   getUserFromCredentials,
   doesUserExist
 }
};

/**
 * attempts to register a user in the DB with the specified details.
 * it provides the results in the specified callback which takes a
 * DataResponseObject as its only parameter
 *
 * @param username
 * @param password
 * @param registrationCallback - takes a DataResponseObject
 */
function registerUserInDB(username, password, registrationCallback){

  //create query using the data in the req.body to register the user in the db
  const registerUserQuery = `INSERT INTO user (username, user_password) VALUES ('${username}', SHA('${password}'))`

  //execute the query to register the user
  mySqlConnection.query(registerUserQuery, registrationCallback)
}

/**
 * Gets the user with the specified username and password.
 * It provides the results in a callback which takes an:
 * an error object which will be set to null if there is no error.
 * and a user object which will be null if there is no user
 *
 * @param username
 * @param password
 * @param callback - takes an error and a user object
 */
function getUserFromCredentials(username, password, callback) {
  const getUserQuery = 'SELECT u.user_id AS user_id, '
    + 'u.username AS username, a.access_token AS access_token '
    + 'FROM user AS u, access_token AS a '
    + `WHERE username = '${username}' `
    + `AND user_password = SHA('${password}') `
    + `AND u.user_id = a.user_id`
    ;
  console.log('getUserFromCredentials query is: ', getUserQuery);
  mySqlConnection.query(getUserQuery, function ( result_map ) {
    callback(
      false,
      result_map.results !== null
      && result_map.results.length  === 1
        ? result_map.results[0] : null
    )
  })
}

/**
 * Determines whether or not user with the specified userName exists.
 * It provides the results in a callback which takes 2 parameters:
 * an error object which will be set to null if there is no error, and
 * secondly a boolean value which says whether or the user exists.
 * The boolean value is set to true if the user exists else it's set
 * to false or it will be null if the results object is null.
 *
 * @param username
 * @param callback - takes an error and a boolean value indicating
 *                   whether a user exists
 */
function doesUserExist(username, callback) {

  //create query to check if the user already exists
  const doesUserExistQuery = `SELECT * FROM user WHERE username = '${username}'`

  //holds the results  from the query
  const sqlCallback = (dataResponseObject) => {

      //calculate if user exists or assign null if results is null
      const doesUserExist = dataResponseObject.results !== null ? dataResponseObject.results.length > 0 ? true : false : null

      //check if there is a user with username and return
      callback(dataResponseObject.error, doesUserExist)
  }

  //execute the query to check if the user exists
  mySqlConnection.query(doesUserExistQuery, sqlCallback)
}
