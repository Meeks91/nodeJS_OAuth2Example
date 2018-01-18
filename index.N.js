//MARK: --- REQUIRE MODULES

const
  portInt = 3000,
  mySqlConnection = require('./databaseHelpers/mySqlWrapper'),
  accessTokenDBHelper = require('./databaseHelpers/accessTokensDBHelper')(mySqlConnection),
  userDBHelper = require('./databaseHelpers/userDBHelper')(mySqlConnection),
  oAuthModel = require('./authorisation/accessTokenModel')(userDBHelper, accessTokenDBHelper),
  oAuth2Server = require('node-oauth2-server'),
  expressObj = require('express'),
  expressApp = expressObj(),
  bodyParser = require('body-parser'),
  cookieParser = require('cookie-parser'),
  reqObj = require('request')
  ;

function noCacheFn( req, res, next) {
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');
  next();
}

// First bite of the apple?
expressApp.use(noCacheFn);
expressApp.use(bodyParser.urlencoded({ extended: true }));
// expressApp.use(function ( req, res, next ) {
//   if ( typeof req.body === 'object' ) {
//     req.body.client_id = 'application';
//     req.body.client_secret = 'secret';
//     next();
//   }
// });

expressApp.oauth = oAuth2Server({
  model: oAuthModel,
  grants: ['password'],
  debug: true
});
// Set the oAuth errorHandler
expressApp.use(expressApp.oauth.errorHandler());

let
  restrictedAreaRoutesMethods = require('./restrictedArea/restrictedAreaRoutesMethods.js'),
  restrictedAreaRoutes = require('./restrictedArea/restrictedAreaRoutes.js')(expressObj.Router(), expressApp, restrictedAreaRoutesMethods),
  authRoutesMethods = require('./authorisation/authRoutesMethods')(userDBHelper),
  authRoutes = require('./authorisation/authRoutes')(expressObj.Router(), expressApp, authRoutesMethods)
  ;

//MARK: --- REQUIRE MODULES

//MARK: --- INITIALISE MIDDLEWARE & ROUTES
// Set the authRoutes for registration and & login requests
expressApp.use('/auth', authRoutes);

// Set up graphical login page
expressApp.get( '/login', function ( req, res, next ) {
  res.sendFile( __dirname + '/views/login.html');
});
expressApp.post('/login', function ( req, res ) {
  var
    query_map = req.query,
    body_map  = req.body,
    auth_url  = req.protocol + '://' + req.headers.host + '/auth/login'
    ;

  body_map.grant_type = 'password';
  body_map.client_id = 'application';
  body_map.client_secret = 'secret';

  // Post for request
  // The rejectUnauthorized solves UNABLE_TO_VERIFY_LEAF_SIGNATURE SSL issue:
  // https://developer.ibm.com/answers/questions/26698/unable-to-verify-\
  // leaf-signature-when-calling-rest-apis-from-node-js.html
  reqObj(
    {
      form   : body_map,
      method : 'POST',
      url    : auth_url,
      rejectUnauthorized : false
    },
    function ( error_data, resp_obj, resp_body ) {
      var resp_map;
      if ( error_data || resp_obj.statusCode !== 200  ) {
        res.send(
          '<html><head></head><body>'
          + '<h1>Error on sign-in</h1>'
          + '<p>Please press the back button and try again.</p>'
          + '</body></html>'
        );
      }
      else {
        resp_map  = JSON.parse( resp_body );
        
        res.cookie( 'access_token', resp_map.access_token,
          { maxAge: 900000, httpOnly: true }
        );
        console.warn( 'wtf?', query_map );
        res.redirect( 301, query_map.redirect_uri || '' );
        // res.send(
        //   '<html><head></head><body>'
        //   + '<h1>Thank you for logging in</h1>'
        //   + '<p>Token is ' + clientAppAccessToken + '</p>'
        //   + '</body></html>'
        // );
      }
    }
  );
});
expressApp.use(cookieParser());
expressApp.use(function ( req, res, next ) {
  var cookie_obj = req.cookies.access_token;
  if ( ! cookie_obj ) {
    console.log( 'no access_token cookie found!' );
    res.redirect( 301, '/login?redirect_uri=' + encodeURIComponent(
      req.protocol + '://' + req.get( 'Host' ) + req.originalUrl
    ));
  }
  else {
    console.log( 'cookie found: ', cookie_obj );
    next();
  }
});

// Set the restrictedAreaRoutes used to demo the accesiblity or routes that ar OAuth2 protected
expressApp.use('/restrictedArea', restrictedAreaRoutes);
// Set the bodyParser to parse the urlencoded post data
expressApp.use('/', expressObj.static('./public'));

// MARK: --- INITIALISE MIDDLEWARE & ROUTES

expressApp.listen( portInt, () => {
  console.log( 'HTTP Listening on port ' + portInt );
});

// Required for https
// https = require('https'),
// readFileSyncFn = require('fs').readFileSync,
// optionMap = {
//   key  : readFileSyncFn('ssl-credentials/le-michaelmikowski.com/privkey1.pem'),
//   cert : readFileSyncFn('ssl-credentials/le-michaelmikowski.com/cert1.pem'),
//   ca   : readFileSyncFn('ssl-credentials/le-michaelmikowski.com/root-cert.pem')
// };

// // Init the server
// https.createServer(optionMap, expressApp).listen(portInt, function () {
//   console.log(`SSL listening on port ${portInt}`);
// });

