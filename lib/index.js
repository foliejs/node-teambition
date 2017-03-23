'use strict'

const request = require('request')
const querystring = require('querystring')

class Base {
  constructor ({token: token, config = {}}) {
    this.protocol = 'https'
    this.host = 'api.teambition.com'
    this.authHost = 'account.teambition.com'
  }

  _getAccessTokenUrl () {
    return `${this.protocol}://${this.authHost}/oauth2/access_token`
  }

  _authCallback (client_id, client_secret) {
    let self
    self = this
    return (req, res, next) => {
      let api, code
      code = req.query.code
      api = self.getAccessTokenUrl()
      return self.post(api, {
        client_id: client_id,
        client_secret: client_secret,
        code: code
      }, (err, body) => {
        req.callbackBody = body
        return next()
      })
    }
  }

  _getAuthorizeUrl (client_id, redirect_uri, state) {
    let qs = querystring.stringify({
      client_id: client_id,
      redirect_uri: redirect_uri,
      state: state
    })
    return `${this.protocol}://${this.authHost}/oauth2/authorize?${qs}`
  }

  invokeGeneric (method, apiURL, params, callback) {
    let headers, options

    if (typeof params === 'function') {
      callback = params
      params = {}
    }
    params || (params = {})
    if (apiURL.indexOf('/') === 0) {
      apiURL = this.protocol + '://' + this.host + apiURL
    }
    headers = {
      'Content-Type': 'application/json'
    }
    if (this.token) {
      headers['Authorization'] = 'OAuth2 ' + this.token
    }
    if (params.headers) {
      headers = params.headers
      delete params.headers
    }
    options = {
      method: method,
      headers: headers,
      url: apiURL,
      json: true
    }
    if (method.toLowerCase() !== 'get') {
      options.form = params
    } else {
      options.qs = params
    }
    return request(options, (err, resp, body) => {
      if (err || resp && resp.statusCode !== 200) {
        err || (err = body)
      }
      return callback(err, body)
    })
  }
}

module.exports = Base