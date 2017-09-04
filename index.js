//MARK: --- REQUIRE MODULES

const port = 8080
const mySqlConnection = require('./databaseHelpers/mySqlWrapper')
const accessTokenDBHelper = require('./databaseHelpers/accessTokensDBHelper')(mySqlConnection)
const userDBHelper = require('./databaseHelpers/userDBHelper')(mySqlConnection)
const oAuthModel = require('./authorisation/accessTokenModel')(userDBHelper, accessTokenDBHelper)
const oAuth2Server = require('node-oauth2-server')
const express = require('express')
const expressApp = express()
expressApp.oauth = oAuth2Server({
  model: oAuthModel,
  grants: ['password'],
  debug: true
})

const restrictedAreaRoutesMethods = require('./restrictedArea/restrictedAreaRoutesMethods.js')
const restrictedAreaRoutes = require('./restrictedArea/restrictedAreaRoutes.js')(express.Router(), expressApp, restrictedAreaRoutesMethods)
const authRoutesMethods = require('./authorisation/authRoutesMethods')(userDBHelper)
const authRoutes = require('./authorisation/authRoutes')(express.Router(), expressApp, authRoutesMethods)
const bodyParser = require('body-parser')

//MARK: --- REQUIRE MODULES

//MARK: --- INITIALISE MIDDLEWARE & ROUTES

//set the bodyParser to parse the urlencoded post data
expressApp.use(bodyParser.urlencoded({ extended: true }))

//set the oAuth errorHandler
expressApp.use(expressApp.oauth.errorHandler())

//set the authRoutes for registration and & login requests
expressApp.use('/auth', authRoutes)

//set the restrictedAreaRoutes used to demo the accesiblity or routes that ar OAuth2 protected
expressApp.use('/restrictedArea', restrictedAreaRoutes)

//MARK: --- INITIALISE MIDDLEWARE & ROUTES

//init the server
expressApp.listen(port, () => {

   console.log(`listening on port ${port}`)
})