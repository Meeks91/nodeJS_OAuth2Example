// This must be tailored to your installation.
var connectMap = {
  host     : 'localhost', // Typically localhost, but can be any db server
  user     : 'root',      // Often root but can be a more restricted user
  password : 'bogus1',    // Password for provided user. User must have rw access to db.
  database : 'oAuth2Test' // Database to user
}
module.exports = connectMap;
