// BEGIN Require modules and general config =================================
const
  bodyParser   = require( 'body-parser'        ),
  cookieParser = require( 'cookie-parser'      ),
  expressFn    = require( 'express'            ),
  morganFn     = require( 'morgan'             ),
  oa2ServerFn  = require( 'node-oauth2-server' ),
  requestObj   = require( 'request'            ),
  //utilObj    = require( 'util'               ),

  mySqlConnection     = require( './databaseHelpers/mySqlWrapper' ),
  accessTokenDBHelper = require( './databaseHelpers/accessTokensDBHelper' )(
    mySqlConnection ),
  userDBHelper        = require( './databaseHelpers/userDBHelper' )(
    mySqlConnection ),
  oa2ModelObj         = require( './authorisation/accessTokenModel' )(
    userDBHelper, accessTokenDBHelper
  ),
  expressApp  = expressFn(),
  portInt     = 3000
  ;

let
  restrictedAreaRoutesMethods, restrictedAreaRoutes,
  authRoutesMethods, authRoutes
  ;

  // expressApp       = expressFn(),
  // fauxAccessToken  = 'xyzpdqEh?',
  // fauxAuthCode     = 'b06u5_c0d3',
  // fauxRefreshToken = '13e07ee4-6fc3-4803-b038-f1f3de2927d7',
  // notifyUrl        = 'https://notification.dev.aisera.com',
  // ao2Model         = require('./model'),
// . END Require modules and general config =================================

// BEGIN utility methods ====================================================
function noCacheFn( req, res, nextFn ) {
  res.header('Cache-Control',
    'private, no-cache, no-store, must-revalidate'
  );
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');
  nextFn();
}
// . END Utility methods ====================================================

// BEGIN configure middleware and routes ====================================
expressApp.use( morganFn( 'dev') );
expressApp.use( bodyParser.urlencoded({ extended: true }) );
expressApp.use( cookieParser() );
expressApp.oauth = oa2ServerFn({
  model: oa2ModelObj,
  grants: ['password'],
  debug: true
});

// configure oAuth
expressApp.use(expressApp.oauth.errorHandler());
restrictedAreaRoutesMethods = require(
  './restrictedArea/restrictedAreaRoutesMethods.js'
);
restrictedAreaRoutes = require(
  './restrictedArea/restrictedAreaRoutes.js'
)( expressFn.Router(), expressApp, restrictedAreaRoutesMethods );
authRoutesMethods = require( './authorisation/authRoutesMethods')(
  userDBHelper
);
authRoutes = require( './authorisation/authRoutes' )(
  expressFn.Router(), expressApp, authRoutesMethods
);
//MARK: --- REQUIRE MODULES

//MARK: --- INITIALISE MIDDLEWARE & ROUTES
// Set the authRoutes for registration and & login requests
expressApp.use('/auth', noCacheFn, authRoutes);

// Set up graphical login page
expressApp.get( '/login', function ( req, res, next ) {
  res.sendFile( __dirname + '/views/login.html');
});
expressApp.post('/login', function ( req, res ) {
  const
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
  requestObj(
    { form   : body_map,
      method : 'POST',
      url    : auth_url,
      rejectUnauthorized : false
    },
    function ( error_data, resp_obj, resp_body ) {
      if ( error_data || resp_obj.statusCode !== 200  ) {
        res.send(
          '<html><head></head><body>'
          + '<h1>Error on sign-in</h1>'
          + '<p>Please press the back button and try again.</p>'
          + '</body></html>'
        );
      }
      else {
        let resp_map  = JSON.parse( resp_body );
        res.cookie( 'access_token', resp_map.access_token,
          { maxAge: 900000, httpOnly: true }
        );
        res.redirect( 301, query_map.redirect_uri || '' );
      }
    }
  );
});

expressApp.use(function ( req, res, nextFn ) {
  const
    cookie_str = req.cookies.access_token,
    redirect_str = '/login?redirect_uri=' + encodeURIComponent(
      req.protocol + '://' + req.get( 'Host' ) + req.originalUrl
    );

  if ( ! cookie_str ) {
    console.log( 'No access_token cookie found!' );
    res.redirect( 301, redirect_str );
  }
  else {
    accessTokenDBHelper.getSession(
      cookie_str,
      function ( error_data, session_row ) {
        if ( error_data || ! session_row ) {
          console.log( 'access_token cookie invalid', error_data, session_row );
          res.redirect( 301, redirect_str );
        }
        else {
          nextFn();
        }
      }
    );
  }
});

// Set the restrictedAreaRoutes used to demo the accesiblity or routes that ar OAuth2 protected
expressApp.use('/restrictedArea', restrictedAreaRoutes);
// Set the bodyParser to parse the urlencoded post data
expressApp.use('/', expressFn.static('./public'));

// Initialize server
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
