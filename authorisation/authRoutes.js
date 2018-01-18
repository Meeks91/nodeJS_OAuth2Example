module.exports =  (router, expressApp, authRoutesMethods) => {

    //route for registering new user
    router.post('/registerUser', authRoutesMethods.registerUser);

    //route for allowing existing user to login
    router.post('/login', expressApp.oauth.grant(), authRoutesMethods.login);

    return router
}
