let mySqlConnection

module.exports = injectedMySqlConnection => {

  mySqlConnection = injectedMySqlConnection

  return {
   saveAccessToken: saveAccessToken,
   getUserIDFromBearerToken: getUserIDFromBearerToken
 }
}

/**
 * Saves the accessToken against the user with the specified userID
 * It provides the results in a callback which takes 2 parameters:
 *
 * @param accessToken
 * @param userID
 * @param callback - takes either an error or null if we successfully saved the accessToken
 */
function saveAccessToken(accessToken, userID, callback) {

  const getUserQuery =  `INSERT INTO access_tokens (access_token, user_id) VALUES ("${accessToken}", ${userID}) ON DUPLICATE KEY UPDATE access_token = "${accessToken}";`

  //execute the query to get the user
  mySqlConnection.query(getUserQuery, (dataResponseObject) => {

      //pass in the error which may be null and pass the results object which we get the user from if it is not null
      callback(dataResponseObject.error)
  })
}

/**
 * Retrieves the userID from the row which has the spcecified bearerToken. It passes the userID
 * to the callback if it has been retrieved else it passes null
 *
 * @param bearerToken
 * @param callback - takes the user id we if we got the userID or null to represent an error
 */
function getUserIDFromBearerToken(bearerToken, callback){

  //create query to get the userID from the row which has the bearerToken
  const getUserIDQuery = `SELECT * FROM access_tokens WHERE access_token = '${bearerToken}';`

  //execute the query to get the userID
  mySqlConnection.query(getUserIDQuery, (dataResponseObject) => {

      //get the userID from the results if its available else assign null
      const userID = dataResponseObject.results != null && dataResponseObject.results.length == 1 ?
                                                              dataResponseObject.results[0].user_id : null

      callback(userID)
  })
}
