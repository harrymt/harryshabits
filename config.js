
'use strict';

require('dotenv').load();

var port_number = process.env.PORT || 5000;
var user_id = process.env.USER_ID || 321;

const WIT_TOKEN = process.env.WIT_TOKEN;
if (!WIT_TOKEN) {
  throw new Error('Missing WIT_TOKEN. Go to https://wit.ai/docs/quickstart to get one.');
}


var FB_PAGE_TOKEN = process.env.FB_PAGE_TOKEN;
if (!FB_PAGE_TOKEN) {
	throw new Error('Missing FB_PAGE_TOKEN. Go to https://developers.facebook.com/docs/pages/access-tokens to get one.');
}

var FB_VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN;
if (!FB_VERIFY_TOKEN) {
    throw new Error('Missing FB_VERIFY_TOKEN. Look at readme for more info.');
}


module.exports = {
  WIT_TOKEN: WIT_TOKEN,
  FB_PAGE_TOKEN: FB_PAGE_TOKEN,
  FB_VERIFY_TOKEN: FB_VERIFY_TOKEN,
  PORT: port_number,
  USER_ID: user_id
};
