module.exports = function attachHostUrlMiddleware(config) {
	return function attachHostUrl(req, res, next) {
		// If the Host header is included in the allowed domains,
		// we add it to the request object.
		// Otherwise, we default to the main URL specified in config.
		req.hostUrl = config.http.allowedDomains.includes(req.headers['host'])
			? req.protocol + '://' + req.headers['host']
			: config.http.url;

		next();
	};
};