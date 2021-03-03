
/**
 * The HTTP context object
 * @typedef {express.Router} Router
 * @type {object}
 * @property {Object} state
 * @property {Object} logger
 * @property {Object} config
 * @property {Object} dashboard
 * @property {Object} http
 */

/**
 * The HTTP context object
 * @typedef {Object} HttpContext
 * @type {object}
 * @property {Object} noAuth
 * @property {Object} raw
 */

/**
 * The APP object
 * @typedef {Object} PluginContext
 * @type {object}
 * @property {Object} state
 * @property {Object} logger
 * @property {Object} config
 * @property {Object} dashboard
 * @property {HttpContext} http
 */

/**
 * The plugin object
 * @typedef {Object} Plugin
 * @property {string?} name
 * @property {string} version
 * @property {string} description
 * @property {string?} author
 */
