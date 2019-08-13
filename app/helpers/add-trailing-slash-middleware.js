module.exports = function addTrailingSlashMiddleware(req, res, next) {
	if (req.url.slice(-1) !== '/') {
		res.redirect(301, req.url + '/');
	} else {
		next();
	}
}