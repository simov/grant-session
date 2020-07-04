
var crypto = require('crypto')
var cookie = require('cookie')
var signature = require('cookie-signature')


module.exports = ({handler, name, secret, cookie:options, embed, store}) => {
  name = name || 'grant'
  options = options || {path: '/', httpOnly: true, secure: false, maxAge: null}
  store = store || {get: async () => {}, set: async () => {}, remove: async () => {}}

  if (!secret) {
    throw new Error('Grant: cookie secret is required')
  }

  return (req, res) => {
    var headers = Object.keys(req.headers)
      .filter((key) => /(?:set-)?cookie/i.test(key))
      .reduce((all, key) => (all[key.toLowerCase()] = req.headers[key], all), {})
    headers['set-cookie'] = headers['set-cookie'] ||
      (req.multiValueHeaders && req.multiValueHeaders['Set-Cookie'])

    var get = () => {
      var data =
        headers.cookie ||
        [].concat(headers['set-cookie']).filter(Boolean).join(' ') ||
        ''
      var value = cookie.parse(data)[name]
      return value ? signature.unsign(value, secret) : undefined
    }

    var set = (data = crypto.randomBytes(20).toString('hex')) => {
      var value = signature.sign(data, secret)
      var output = cookie.serialize(name, value, options)
      save(output)
    }

    var save = (data) => {
      var values = [].concat(headers['set-cookie'], data).filter(Boolean)
      headers['set-cookie'] = values
    }

    return {
      get: async () => {
        var session = {grant: {}}
        var value = get()
        if (value) {
          return embed ? JSON.parse(value) : await store.get(value) || session
        }
        else {
          embed ? set(JSON.stringify(session)) : set()
          // saveUninitialized: true
          // await store.set(session)
          return session
        }
      },
      set: async (value) => {
        if (embed) {
          set(JSON.stringify(value))
        }
        if (/node|vercel/.test(handler) && headers['set-cookie']) {
          res.setHeader('set-cookie', headers['set-cookie'])
        }
        return store.set(get(), value)
      },
      remove: async () => store.remove(get()),
      headers,
    }
  }
}
