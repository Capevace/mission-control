
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
 * The plugin object
 * @typedef {Object} Plugin
 * @property {string?} name
 * @property {string} version
 * @property {string} description
 * @property {string?} author
 */

/**
 * Module dependency injection for plugins
 * @typedef   {Object}   PluginDependencies
 * @property  {Auth}     auth     - The Auth module
 * @property  {HTTP}     http     - The HTTP module
 * @property  {Sync}     sync     - The Sync instance
 * @property  {Config}   config   - The Mission Control config
 * @property  {Logging}  logging  - The logging module
 * @property  {Database} database - The database instance
 */