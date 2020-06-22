
var crypto = require('crypto')
var cookie = require('cookie')
var signature = require('cookie-signature')


var handlers = {
  node: (req, res) => ({
    cookie: req.headers.cookie,
    'set-cookie': res.getHeader('set-cookie')
  }),
  aws: (req) => ({
    cookie: req.headers.Cookie,
    'set-cookie': req.multiValueHeaders['Set-Cookie']
  }),
}

module.exports = ({handler, options, get, set, remove}) => {
  var name = options.name || 'grant'
  var secret = options.secret
  var options = options.cookie || {path: '/', httpOnly: true, secure: false, maxAge: null}

  if (!secret) {
    throw new Error('Grant: cookie secret is required')
  }

  return (req, res) => {
    var headers = handlers[handler](req, res)
    var id = () => {
      var data =
        headers.cookie ||
        [].concat(headers['set-cookie']).filter(Boolean).join(' ') ||
        ''
      var sid = cookie.parse(data)[name]
      return sid ? signature.unsign(sid, secret) : undefined
    }
    var create = () => {
      var id = crypto.randomBytes(20).toString('hex')
      var sid = signature.sign(id, secret)
      var data = cookie.serialize(name, sid, options)
      var values = [].concat(headers['set-cookie'], data).filter(Boolean)
      headers['set-cookie'] = values
    }
    return {
      get: async () => {
        var session = {grant: {}}
        var _id = id()
        if (_id) {
          session = await get(_id) || session
        }
        else {
          create()
          // saveUninitialized: true
          // await set(session)
        }
        return session
      },
      set: async (value) => {
        if (handler === 'node' && headers['set-cookie']) {
          res.setHeader('set-cookie', headers['set-cookie'])
        }
        return set(id(), value)
      },
      remove: async () => remove(id()),
      headers,
    }
  }
}
