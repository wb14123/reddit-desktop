'use strict';
const snoowrap = require('snoowrap');

const r = new snoowrap({
  user_agent: 'reddit-desktop',
  client_id: 'YKa6s8nWTInbhQ',
  client_secret: '',

});

r.config({debug: true});
r.get_me().then(console.log);

