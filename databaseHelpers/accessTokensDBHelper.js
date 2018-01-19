const expiryInt  = 60; // 1 minute expiry for testing

function clearUserSessions( userId, callback ) {
  const clearQuery = 'DELETE FROM session '
    + 'WHERE UNIX_TIMESTAMP( NOW() - 120 ) '
    + '> UNIX_TIMESTAMP( touch_time );'
    ;

  if ( !userId ) { callback( null ); }
  else {
    mySqlConnection.query( clearQuery, ( dataResponseObject ) => {
      callback( null, dataResponseObject.results );
    } );
  }
}

function cleanAccessTokenByUserId ( userId, callback ) {
  const selectQuery = 'SELECT access_token_id FROM access_token '
    + `WHERE user_id = '${userId}' ORDER BY access_token_id DESC LIMIT 1;`
  ;

  mySqlConnection.query( selectQuery, function ( dataResponseObject ) {
    const
      result_list   = dataResponseObject.results,
      result_map    = result_list && result_list[ 0 ],
      last_token_id = result_map.access_token_id
    ;

    if ( !last_token_id ) {
      callback();
    }
    else {
      const cleanQuery = `DELETE FROM access_token where user_id = '${userId}' `
        + `AND access_token_id != ${last_token_id}`;

      mySqlConnection.query( cleanQuery, function ( dataResponseObject ) {
        callback( dataResponseObject.error );
      } );
    }
  } );
}

function createSession ( accessToken, callback ) {
  const createQuery = 'INSERT INTO session ( session_hash ) '
    + `VALUES ( '${accessToken}' ) `
    + `ON DUPLICATE KEY UPDATE session_hash='${accessToken}';`
  ;
  mySqlConnection.query( createQuery, ( dataResponseObject ) => {
    const
      result_list = dataResponseObject.results,
      result_map  = result_list && result_list[ 0 ],
      error_msg   = result_map ? null : 'No session found'
    ;
    if ( callback ) {
      callback( error_msg, result_map );
    }
  } );
}

/**
 * Retrieve the user_id from the row which has the specified accessToken. It
 * passes the user_id to the callback if it has been retrieved else it passes null
 *
 * @param accessToken
 * @param callback - takes the user id if found else null
 */
function getUserIdFromAccessToken ( accessToken, callback ) {
  // Create query to get the user_id from the row which has the accessToken
  const getUserQuery = 'SELECT * FROM access_token '
    + `WHERE access_token = '${accessToken}';`;

  // Execute the query to get the userID
  mySqlConnection.query( getUserQuery, ( dataResponseObject ) => {
    // Get the user_id from the results ( or null ) and use for callback
    const user_id = dataResponseObject.results
    && dataResponseObject.results.length == 1
      ? dataResponseObject.results[ 0 ].user_id : null;
    callback( null, user_id );
  } );
}

function getSession ( accessToken, callback ) {
  const sessionQuery = 'SELECT user_id, '
    + 'UNIX_TIMESTAMP( touch_time ) '
    + 'AS touch_time_int, access_token '
    + 'FROM session AS s, access_token AS a '
    + 'WHERE a.access_token = s.session_hash '
    + `AND s.session_hash='${accessToken}';`;

  console.warn( 'session query is ' + sessionQuery );
  // Execute the query to get response row
  mySqlConnection.query( sessionQuery, ( dataResponseObject ) => {
    const
      floor_int   = Math.floor( Date.now() / 1000 ) - expiryInt,
      result_list = dataResponseObject.results,
      result_map  = result_list && result_list[ 0 ]
      ;

    if ( result_map ) {
      if ( result_map.touch_time_int < floor_int ) {
        clearUserSessions( result_map.user_id, function () {
          callback( null, null );
        } );
      }
      else {
        callback( null, result_map );
      }
    }
    else {
      callback( null, null );
    }
  } );
}

/** Save the accessToken against the user with the specified user_id.
 * Provides the results in a callback which takes 2 parameters:
 *
 * @param accessToken
 * @param user_id
 * @param callback - Called aon complete with null or error message
 */
function storeAccessToken ( accessToken, userId, callback ) {
  const saveTokenQuery = 'INSERT INTO access_token ( access_token, user_id )'
    + ` VALUES ( '${accessToken}', '${userId}' )`
    + ' ON DUPLICATE KEY UPDATE'
    + ` access_token = '${accessToken}';`;

  mySqlConnection.query( saveTokenQuery, ( dataResponseObject ) => {
    if ( dataResponseObject.error ) {
      callback( dataResponseObject.error );
    }
    else {
      console.warn( 'Access Token stored', dataResponseObject.results );
      cleanAccessTokenByUserId( userId, callback );
    }
  } );
}

let mySqlConnection;
function mainFn( injectedMySqlConnection ) {
  mySqlConnection = injectedMySqlConnection;
  return {
    cleanAccessTokenByUserId,
    clearUserSessions,
    createSession,
    getSession,
    getUserIdFromAccessToken,
    storeAccessToken,
  };
}
module.exports = mainFn;


