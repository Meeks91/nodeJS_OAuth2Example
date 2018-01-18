let userDBHelper

module.exports = injectedUserDBHelper => {

  userDBHelper = injectedUserDBHelper

  return {
    registerUser: registerUser,
    login: login
  }
}

/* handles the api call to register the user and insert them into the user table.
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

function login(registerUserQuery, res) {
  console.warn( 'response', '>>>>', arguments );
  // resp_map = JSON.parse( resp_body );
  // clientAppAccessToken = resp_map.access_token;
  // res.cookie( 'access_token', clientAppAccessToken, 
  //   { maxAge: 900000, httpOnly: true } );
  // res.send(
  //   '<html><head></head><body>'
  //   + '<h1>Thank you for logging in</h1>'
  //   + '<p>Token is ' + clientAppAccessToken + '</p>'
  //   + '</body></html>'
  // );
}

// // Handle POST for login
// exprApp.post('/', function ( req, res ) {
//   var
//     // query_map = req.query,
//     body_map  = req.body,
//     auth_url  = req.protocol + '://' + req.headers.host + '/auth/login'
//     ;
//
//   body_map.grant_type = 'password';
//   // TODO: Get secret by looking it up via client_id
//   body_map.client_secret = 'null';
//
//   // Post for request
//   // The rejectUnauthorized solves UNABLE_TO_VERIFY_LEAF_SIGNATURE SSL issue:
//   // https://developer.ibm.com/answers/questions/26698/unable-to-verify-\
//   // leaf-signature-when-calling-rest-apis-from-node-js.html
//   reqObj(
//     {
//       form   : body_map,
//       method : 'POST',
//       url    : auth_url,
//       rejectUnauthorized : false
//     },
//     function ( error_data, resp_obj, resp_body ) {
//       var resp_map;
//       if ( error_data || resp_obj.statusCode !== 200  ) {
//         res.send(
//           '<html><head></head><body>'
//           + '<h1>Error on sign-in</h1>'
//           + '<p>Please press the back button and try again.</p>'
//           + '</body></html>'
//         );
//       }
//       else {
//         resp_map = JSON.parse( resp_body );
//         clientAppAccessToken = resp_map.access_token;
//         res.cookie( 'access_token', clientAppAccessToken, 
//           { maxAge: 900000, httpOnly: true } );
//         res.send(
//           '<html><head></head><body>'
//           + '<h1>Thank you for logging in</h1>'
//           + '<p>Token is ' + clientAppAccessToken + '</p>'
//           + '</body></html>'
//         );
//       }
//     }
//   );
// });


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
