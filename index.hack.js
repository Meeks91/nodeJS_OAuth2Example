//MARK: --- REQUIRE MODULES

const
  httpsPort = 8080,
  https = require('https'),
  readFileSyncFn = require('fs').readFileSync,
  mySqlConnection = require('./databaseHelpers/mySqlWrapper'),
  accessTokenDBHelper = require('./databaseHelpers/accessTokensDBHelper')(mySqlConnection),
  userDBHelper = require('./databaseHelpers/userDBHelper')(mySqlConnection),
  oAuthModel = require('./authorisation/accessTokenModel')(userDBHelper, accessTokenDBHelper),
  oAuth2Server = require('node-oauth2-server'),
  express = require('express'),
  exprApp = express(),
  bodyParser = require('body-parser'),
  cookieParser = require('cookie-parser'),
  reqObj = require('request'),
  optionMap = {
    key  : readFileSyncFn('ssl-credentials/le-michaelmikowski.com/privkey1.pem'),
    cert : readFileSyncFn('ssl-credentials/le-michaelmikowski.com/cert1.pem'),
    ca   : readFileSyncFn('ssl-credentials/le-michaelmikowski.com/root-cert.pem')
  };

exprApp.oauth = oAuth2Server({
  model: oAuthModel,
  grants: ['password'],
  debug: true
});

var
  restrictedAreaRoutesMethods = require('./restrictedArea/restrictedAreaRoutesMethods.js'),
  restrictedAreaRoutes = require('./restrictedArea/restrictedAreaRoutes.js')(express.Router(), exprApp, restrictedAreaRoutesMethods),
  authRoutesMethods = require('./authorisation/authRoutesMethods')(userDBHelper),
  authRoutes = require('./authorisation/authRoutes')(express.Router(), exprApp, authRoutesMethods),

  authServerAccessToken = null,
  clientAppAccessToken  = null
  ;

function noCacheFn( req, res, next) {
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');
  next();
}
//MARK: --- REQUIRE MODULES

//MARK: --- INITIALISE MIDDLEWARE & ROUTES
// Set the bodyParser to parse the urlencoded post data
exprApp.use('/', noCacheFn, express.static('./public'));
exprApp.use(bodyParser.urlencoded({ extended: true }));

// Set the oAuth errorHandler
exprApp.use(exprApp.oauth.errorHandler());

// Set the authRoutes for registration and & login requests
exprApp.use('/auth', noCacheFn, authRoutes);

exprApp.use(cookieParser());
// exprApp.use(function ( req, res, next ) {
//   var cookie_obj = req.cookies.auth;
//   if ( ! cookie_obj ) {
//     console.warn( 'no auth cookie found!' );
//   }
//   else {
//     console.warn( 'cookie found: ', cookie_obj );
//   }
// });

// Handle GET for /fetch
exprApp.get( '/fetch', noCacheFn, function ( req, res ) {
  console.warn( authServerAccessToken, '<<<<<' );
  if ( authServerAccessToken === null ) {
    res.redirect( 301, '/mock' );
  }
  else {
    // The rejectUnauthorized solves UNABLE_TO_VERIFY_LEAF_SIGNATURE SSL issue:
    // https://developer.ibm.com/answers/questions/26698/unable-to-verify-\
    // leaf-signature-when-calling-rest-apis-from-node-js.html
    reqObj(
      { 
        form : {
          tenantName    : '00D1I000000lYe9UAE',
          connectorName : 'SALESFORCE',
          notification  : 
            '{"recordId":"5001I000002SDOIQA4", "actionType":"create"}'
        },
        headers : {
          'Cache-Control' : 'no-cache',
          Authorization : 'Bearer ' + authServerAccessToken
        },
        method : 'POST',
        url    : 'https://powercss.org:8443/api/v0/notifications',
        rejectUnauthorized : false
      },
      function ( error_data, resp_obj, resp_body ) {
        if ( error_data || resp_obj.statusCode !== 200  ) {
          res.send(
            '<html><head></head><body>'
            + '<h1>Trouble fetching notification</h1>'
            + '<p>Please press the back button and try again.</p>'
            + '</body></html>'
          );
        }
        else {
          res.send(
            '<html><head></head><body>'
            + '<h1>Notify response received</h1>'
            + '<pre>' + JSON.stringify( resp_body ) + '</pre>'
            + '</body></html>'
          );
        }
      }
    );
  }
});

// Handle GET for redirect to /mock
exprApp.get('/mock', noCacheFn, function ( req, res ) {
  var
    query_map    = req.query || {},
    auth_url     = 'https://powercss.org:8443/oauth/token',
    redirect_uri = query_map.redirect_uri || ''
    ;

  if ( ! query_map.auth_code ) {
    return res.send( 
      '<html><head></head><body>'
      + '<p><a href="https://powercss.org:8443/authorize'
      + '?redirect_uri=https%3A%2F%2Fmichaelmikowski.com:8080%2Fmock'
      + '&client_id=application&scope=sf001&prompt=consent'
      + '&access_type=offline&state=xyz'
      + '">'
      + 'Request XXX access'
      + '</a></p>'
      + '</body></html>'
    );
  }
  // Post request for token
  // The rejectUnauthorized solves UNABLE_TO_VERIFY_LEAF_SIGNATURE SSL issue:
  // https://developer.ibm.com/answers/questions/26698/unable-to-verify-\
  // leaf-signature-when-calling-rest-apis-from-node-js.html
  reqObj(
    { 
      form : {
        grant_type    : 'authorization_code',
        auth_code     : query_map.auth_code, // 'b06u5_c0d3',
        client_id     : 'application',
        client_secret : 'secret',
        redirect_uri  : redirect_uri // This is probably useless
      },
      method : 'POST',
      url    : auth_url,
      rejectUnauthorized : false
    },
    function ( error_data, resp_obj, resp_body ) {
      var resp_map;
      if ( error_data || resp_obj.statusCode !== 200 ) {
        console.warn( '>>>>', error_data, '\n', resp_obj );
        res.send(
          '<html><head></head><body>'
          + '<h1>Error acquiring access</h1>'
          + '<p>Please press the back button and try again.</p>'
          + '</body></html>'
        );
      }
      else {
        resp_map = JSON.parse( resp_body );
        authServerAccessToken = resp_map.access_token;
        res.send(
          '<html><head></head><body>'
          + '<h1>Auth token received</h1>'
          + '<a href="/fetch?' + Date.now()
          + '">Click here</a> to test Notification API'
          + '</body></html>'
        );
      }
    }
  );
});

// Handle POST for login
exprApp.post('/', function ( req, res ) {
  var
    // query_map = req.query,
    body_map  = req.body,
    auth_url  = req.protocol + '://' + req.headers.host + '/auth/login'
    ;

  body_map.grant_type = 'password';
  // TODO: Get secret by looking it up via client_id
  body_map.client_secret = 'null';

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
        resp_map = JSON.parse( resp_body );
        clientAppAccessToken = resp_map.access_token;
        res.cookie( 'access_token', clientAppAccessToken, 
          { maxAge: 900000, httpOnly: true } );
        res.send(
          '<html><head></head><body>'
          + '<h1>Thank you for logging in</h1>'
          + '<p>Token is ' + clientAppAccessToken + '</p>'
          + '</body></html>'
        );
      }
    }
  );
});

// Set the restrictedAreaRoutes used to demo the accesiblity or routes that ar OAuth2 protected
exprApp.use('/restrictedArea', restrictedAreaRoutes);
// MARK: --- INITIALISE MIDDLEWARE & ROUTES

// Init the server
https.createServer(optionMap, exprApp).listen(httpsPort, function () {
  console.log(`SSL listening on port ${httpsPort}`);
});
