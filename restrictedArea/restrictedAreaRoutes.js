// Route for restricted area
module.exports =  (router, expressApp, restrictedAreaRoutesMethods) => {
    router.post('/enter',  expressApp.oauth.authorise(), restrictedAreaRoutesMethods.accessRestrictedArea)
    return router
}
