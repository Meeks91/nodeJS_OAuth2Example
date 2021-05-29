// Route for restricted area
function mainFn ( router, expressApp, restrictedAreaRoutesMethods ) {
  router.post(
    '/enter',
    expressApp.oauth.authorise(),
    restrictedAreaRoutesMethods.accessRestrictedArea
  );
  return router;
}
module.exports = mainFn;
