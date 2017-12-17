const 
  mySql = require('mysql'),
  connectMap = require('../config/credentials.js' )

let mysqlConnectObj //object which holds the connection to the db

// Create the connection to the db
function initConnection() {
   mysqlConnectObj = mySql.createConnection( connectMap );
}

/**
 * executes the specified sql query and provides a callback which is given
 * with the results in a DataResponseObject
 *
 * @param queryString
 * @param callback - takes a DataResponseObject
 */
function query(queryString, callback){

  // Init the connection object. Needs to be done everytime as we call end()
  //  on the connection after the call is complete
  initConnection()

  // Connect to the db
  mysqlConnectObj.connect()

  // Execute the query and collect the results in the callback
  mysqlConnectObj.query(queryString, function(error, results, fields){

      console.log('mySql: query: error is: ', error, ' and results are: ', results);

    // Disconnect from db
    mysqlConnectObj.end();

    // Send response in callback
    callback(createDataResponseObject(error, results))
  })
}

/**
 * creates and returns a DataResponseObject made out of the specified parameters.
 * A DataResponseObject has two variables. An error which is a boolean and the results of the query.
 *
 * @param error
 * @param results
 * @return {DataResponseObject<{error, results}>}
 */
function createDataResponseObject(error, results) {

    return {
      error: error,
      results: results === undefined ? null : results === null ? null : results
     }
  }

module.exports = { query: query }
