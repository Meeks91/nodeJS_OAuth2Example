module.exports =  (router, expressApp, restrictedAreaRoutesMethods) => {

    //route for registering new users
    router.post('/enter',  expressApp.oauth.authorise(), restrictedAreaRoutesMethods.accessRestrictedArea)

    return router
}
