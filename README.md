
# grant-session

> _Session handler for Grant_

```js
{
  handler: 'aws', // required
  name: 'grant',
  secret: '...', // required
  cookie: {path: '/', httpOnly: true, secure: false, maxAge: null},
  embed: false,
  store: {
    get: async (key) => {},
    set: async (key, value) => {},
    remove: async (key) => {},
  }
}
```

- `handler` - Grant handler name, either `node`, `aws` or `vercel` **required**
- `name` - the name of the session cookie, defaults to `grant`
- `secret` - used to sign the cookie **required**
- `cookie` - [cookie] options, defaults to `{path: '/', httpOnly: true, secure: false, maxAge: null}`
- `embed` - embed the session data into the cookie, possible value: `true`
- `store` - external session store implementation, `embed` have to be falsy and the store methods have to be implemented

Either `embed` have to be `true` or the `store` have to be implemented!


  [cookie]: https://www.npmjs.com/package/cookie
