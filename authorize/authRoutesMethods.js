let userDBHelper, accessTokenDBHelper;

/* handles the api call to register the user and insert them into the user table.
  The req body should contain a username and password. */
function registerUser ( req, res ){
    console.log(
      `authRoutesMethods: registerUser: req.body is:`, req.body
    );

    // Check if user already exists
    userDBHelper.doesUserExist(
      req.body.username,
      function (sqlError, doesUserExist) {
        // Check if user exists
        if (sqlError !== null || doesUserExist){

          // Message to give summary to client
          const message = sqlError !== null
            ? 'Operation unsuccessful' : 'User already exists';

          // Detail error message from callback
          const error =  sqlError !== null ? sqlError : 'User already exists';
          sendResponse( res, message, sqlError );
          return;
        }

        //register the user in the db
        userDBHelper.registerUserInDB(
          req.body.username,
          req.body.password,
          function ( response_map ) {
            // Create message for the api response
            const message =  response_map.error === null
              ? 'Registration was successful' : 'Failed to register user';
            sendResponse( res, message, response_map.error );
          }
        );
      }
    )
  }

  function login ( req, res ) {
    userDBHelper.getUserFromCredentials(
      req.body.username, req.body.password,
      function ( error_data, result_map ) {
        if ( error_data || ( ! result_map ) ) {
          res.send({ error : 'Cannot get user' });
        }
        else {
          accessTokenDBHelper.createSession(
            result_map.access_token,
            function () { res.send( result_map ); }
          );
        }
      }
    )
  }

//sends a response created out of the specified parameters to the client.
//The typeOfCall is the purpose of the client's api call
function sendResponse(res, message, error) {
  res.status(
      error !== null ? error !== null ? 400 : 200 : 400
    )
    .json({
      message : message,
      error   : error,
    });
}

function mainFn ( injectedUserDBHelper, injectedAccessTokenDBHelper ) {
  userDBHelper = injectedUserDBHelper;
  accessTokenDBHelper = injectedAccessTokenDBHelper;

  return { login, registerUser };
}

module.exports =  mainFn;

