const config = {
	clients: [{
		clientId: 'application',
		clientSecret: 'secret',
    redirectUri: '/login',
    grants : [
      'password', 'authorizaion_code', 'refresh_token'
    ]
	}],
	confidentialClients: [{
		clientId: 'application',
		clientSecret: 'secret',
    grants : [
      'password', 'authorizaion_code', 'refresh_token'
    ]
	}],
	tokens: [],
	users: [{
		id: '123',
		username: 'pedroetb',
		password: 'password'
	}]
};

/**
 * Dump the memory storage content (for debug).
 */

function dump () {
	console.log('clients', config.clients);
	console.log('confidentialClients', config.confidentialClients);
	console.log('tokens', config.tokens);
	console.log('users', config.users);
}

/*
 * Methods used by all grant types.
 */

function getAccessToken (bearerToken, callback) {
	const tokens = config.tokens.filter(function(token) {
		return token.accessToken === bearerToken;
	});

	return callback(false, tokens[0]);
}

function getClient (clientId, clientSecret, callback) {
  let clients, confidentialClients;

	clients = config.clients.filter(function(client) {
		return client.clientId === clientId && client.clientSecret === clientSecret;
	});

	confidentialClients = config.confidentialClients.filter(function(client) {
		return client.clientId === clientId && client.clientSecret === clientSecret;
	});
	callback(false, clients[0] || confidentialClients[0]);
}

function grantTypeAllowed (clientId, grantType, callback) {
	let clientsSource, clients = [];
	if (grantType === 'password') {
		clientsSource = config.clients;
	} else if (grantType === 'client_credentials') {
		clientsSource = config.confidentialClients;
	}
	if (!!clientsSource) {
		clients = clientsSource.filter(function(client) {
			return client.clientId === clientId;
		});
	}
	callback(false, clients.length);
}

function saveAccessToken (accessToken, clientId, expires, user, callback) {
	config.tokens.push({
		accessToken: accessToken,
		expires: expires,
		clientId: clientId,
		user: user
	});
	callback(false);
}

/*
 * Method used only by password grant type.
 */

function getUser (username, password, callback) {
	const users = config.users.filter(function(user) {
		return user.username === username && user.password === password;
	});
	callback(false, users[0]);
}

/*
 * Method used only by client_credentials grant type.
 */

function getUserFromClient (clientId, clientSecret, callback) {
	const clients = config.confidentialClients.filter(function(client) {
		return client.clientId === clientId && client.clientSecret === clientSecret;
	});
	let user;
	if (clients.length) {
		user = {
			username: clientId
		};
	}
	callback(false, user);
}

function saveAuthorizationCode () {
  console.warn( '>>>> saveAuthorizationCode', arguments );
}
// Export model definition object.

module.exports = {
	getAccessToken,
	getClient,
	getUser,
	getUserFromClient,
	grantTypeAllowed,
	saveAccessToken,
  saveAuthorizationCode,
};
