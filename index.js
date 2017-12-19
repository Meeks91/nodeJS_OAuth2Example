//MARK: --- REQUIRE MODULES

const port = 8080;
const mySqlConnection = require('./databaseHelpers/mySqlWrapper');
const accessTokenDBHelper = require('./databaseHelpers/accessTokensDBHelper')(mySqlConnection);
const userDBHelper = require('./databaseHelpers/userDBHelper')(mySqlConnection);
const oAuthModel = require('./authorisation/accessTokenModel')(userDBHelper, accessTokenDBHelper);
const oAuth2Server = require('node-oauth2-server');
const express = require('express');
const expressApp = express();
expressApp.oauth = oAuth2Server({
  model: oAuthModel,
  grants: ['password'],
  debug: true
});

const restrictedAreaRoutesMethods = require('./restrictedArea/restrictedAreaRoutesMethods.js');
const restrictedAreaRoutes = require('./restrictedArea/restrictedAreaRoutes.js')(express.Router(), expressApp, restrictedAreaRoutesMethods);
const authRoutesMethods = require('./authorisation/authRoutesMethods')(userDBHelper);
const authRoutes = require('./authorisation/authRoutes')(express.Router(), expressApp, authRoutesMethods);
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const reqObj = require('request');
//MARK: --- REQUIRE MODULES

//MARK: --- INITIALISE MIDDLEWARE & ROUTES
// Set the bodyParser to parse the urlencoded post data
expressApp.use(bodyParser.urlencoded({ extended: true }));

// Set the oAuth errorHandler
expressApp.use(expressApp.oauth.errorHandler());

// Set the authRoutes for registration and & login requests
expressApp.use('/auth', authRoutes);

// expressApp.use(cookieParser());
// expressApp.use(function ( req, res, next ) {
//   var cookie_obj = req.cookies.auth;
//   if ( ! cookie_obj ) {
//     console.warn( 'no auth cookie found!' );
//   }
//   else {
//     console.warn( 'cookie found: ', cookie_obj );
//   }
// });

expressApp.post('/', function ( req, res ) {
  var
    query_map = req.query,
    body_map  = req.body,
    auth_url  = req.protocol + '://' + req.headers.host + '/auth/login'
    ;

  body_map.grant_type = 'password';
  // TODO: Get secret by looking it up via client_id
  body_map.client_secret = 'null';

  // Post for request
  reqObj({
    form   : body_map,
    method : 'POST',
    // This solves the UNABLE_TO_VERIFY_LEAF_SIGNATURE SSL bug found here: 
    // https://developer.ibm.com/answers/questions/26698/unable-to-verify-\
    // leaf-signature-when-calling-rest-apis-from-node-js.html
    rejectUnauthorized: false,
    url    : auth_url
  },
  function ( error_data, resp_obj, body_obj ) {
    var
      redirect_uri = query_map.redirect_uri || '/public'
      ;

    console.warn( '>>>>' + JSON.stringify( arguments ) );
    if ( error_data || resp_obj.statusCode !== 200  ) { 
      res.send(
        '<html><head></head><body>'
        + '<h1>Error on sign-in</h1>'
        + '<p>Please press the back button and try again</p>'
        + '</body></html>'
      );
    }
    else {
      resp_obj.cookie( 'auth', token_str, { maxAge: 900000, httpOnly: true } );
      res.redirect( 301, redirect_uri + '?token=' + token_str  );
    }
  });
});

//set the restrictedAreaRoutes used to demo the accesiblity or routes that ar OAuth2 protected
expressApp.use('/restrictedArea', restrictedAreaRoutes);
expressApp.use('/', express.static('public'));
//MARK: --- INITIALISE MIDDLEWARE & ROUTES

//init the server
expressApp.listen(port, () => {
    console.log(`listening on port ${port}`);
});
