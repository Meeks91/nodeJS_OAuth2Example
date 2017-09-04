module.exports =  (router, expressApp, restrictedAreaRoutesMethods) => {

    //route for entering into the restricted area.
    router.post('/enter',  expressApp.oauth.authorise(), restrictedAreaRoutesMethods.accessRestrictedArea)

    return router
}
