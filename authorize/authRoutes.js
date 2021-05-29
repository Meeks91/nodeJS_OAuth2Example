module.exports =  (router, expressApp, authRoutesMethods) => {

    // Register new user
    router.post('/registerUser', authRoutesMethods.registerUser);

    // Existing user to login
    router.post('/login', authRoutesMethods.login );
    // router.post('/login', expressApp.oauth.grant(), authRoutesMethods.login);

    return router
}
