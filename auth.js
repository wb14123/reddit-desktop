
request = require('request')

const clientId = 'YKa6s8nWTInbhQ'
const redirectUrl = 'view://reddit_redirect.html'
const scope = 'identity,read,subscribe,mysubreddits'
const baseUrl = 'https://www.reddit.com/api/v1'


function requestToken(code, cb) {
  const tokenUrl = `${baseUrl}/access_token`
  console.log(tokenUrl)
  const opts = {
    url: tokenUrl,
    method: 'POST',
    json: true,
    auth: {
      user: clientId,
      pass: ''
    },
    form: {
      grant_type: 'authorization_code',
      'code': code,
      'redirect_uri': redirectUrl
    }
  }
  request(opts, function(err, res, body) {
    console.log(body.access_token)
    cb(undefined, body.access_token)
  })
}

function getToken(win, cb) {
  const authUrl = `${baseUrl}/authorize?client_id=${clientId}&response_type=code&state=RANDOM_STRI}&redirect_uri=${redirectUrl}&scope=${scope}`
  win.loadURL(authUrl)

  win.webContents.on('did-get-redirect-request', (event, oldUrl, newUrl, isMainFrame,
        httpResponseCode, requestMethod, referrer, headers) => {
    if (newUrl.startsWith(redirectUrl)) {
      console.log(newUrl)
      const codeRe = /code=([\w-]+)/
      const code = newUrl.match(codeRe)[1]
      console.log(code)
      console.log(cb)
      requestToken(code, cb)
    }
  })
}

module.exports.getToken = getToken
