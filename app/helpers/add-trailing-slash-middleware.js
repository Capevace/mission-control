/**
 * Express middleware to force a trailing slash onto a route.
 *
 * e.g.
 * /dashboard -> /dashboard/
 */
module.exports = function addTrailingSlashMiddleware(req, res, next) {
	if (req.url.slice(-1) !== '/') {
		res.redirect(301, req.url + '/');
	} else {
		next();
	}
}