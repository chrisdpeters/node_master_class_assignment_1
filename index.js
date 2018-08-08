/**
 * Primary file for API.
 */

// Dependencies
const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./config');
const fs = require('fs');

// Possible greetings.
const greetings = {
  'English'  : 'Hello',
  'German'   : 'Hallo',
  'French'   : 'Salut',
  'Italian'  : 'Ciao',
  'Czech'    : 'Ahoj',
  'Greek'    : 'YAH sahs',
  'Croatian' : 'Bog',
  'Dutch'    : 'Hallo',
  'Swedish'  : 'Hej',
  'Polish'   : 'Czesc',
  'Spanish'  : 'Hola',
  'Chinese'  : 'Ni hao',
  'Japanese' : "Kon'nichiwa",
  'Hebrew'   : 'Shalom',
  'Turkish'  : 'Merhaba',
  'Swahili'  : 'Hujambo'
};

const greetingKeys = Object.keys(greetings);

// Instantiate HTTP server.
const httpServer = http.createServer(unifiedServer);

// Start HTTPS server.
httpServer.listen(config.httpPort, () => {
  console.log('The server is listening on port ' + config.httpPort);
});

// Instantiate HTTPS server.
const httpsServerOptions = {
  key: fs.readFileSync('./https/key.pem'),
  cert: fs.readFileSync('./https/cert.pem')
};

const httpsServer = https.createServer(httpsServerOptions, unifiedServer);

// Start HTTPS server.
httpsServer.listen(config.httpsPort, () => {
  console.log('The server is listening on port ' + config.httpsPort);
});

// Server logic for both http and https servers.
function unifiedServer (req, res) {
  // Get URL and parse it.
  let parsedUrl = url.parse(req.url, true);

  // Get path from URL.
  let path = parsedUrl.pathname;
  let trimmedPath = path.replace(/^\/+|\/+$/g, '');

  // Get query string as an object.
  let queryStringObject = parsedUrl.query;

  // Get HTTP method.
  let method = req.method.toLowerCase();

  // Get headers as an object.
  let headers = req.headers;

  // Get payload if there is any.
  let decoder = new StringDecoder('utf-8');
  let buffer = '';

  req.on('data', data => {
    buffer += decoder.write(data);
  });

  req.on('end', () => {
    buffer += decoder.end();

    // Choose handler this request should go to.
    let chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;

    // Construct data object to send to handler.
    let data = {
      trimmedPath: trimmedPath,
      queryStringObject: queryStringObject,
      method: method,
      headers: headers,
      payload: buffer
    };

    // Route request to handler specified in the router.
    chosenHandler(data, (statusCode, payload) => {
      // Use the status code called back to the handler or default to 200.
      statusCode = typeof statusCode === 'number' ? statusCode : 200;

      // Use the payload called back by the handler, or default to an empty object.
      payload = typeof payload === 'object' ? payload : {};

      // Convert payload to string.
      let payloadString = JSON.stringify(payload);

      // Return response.
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(statusCode);
      res.end(payloadString);

      // Log request path.
      console.log('Returning this response:', statusCode, payloadString);
    });
  });
};

// Define handlers.
const handlers = {
  hello: (data, callback) => {
    // Callback an HTTP status code and a payload.
    if (data.method === 'post') {
      // Choose a greeting and language at random.
      let key = greetingKeys[Math.floor(Math.random() * greetingKeys.length)];
      callback(200, { greeting: greetings[key] + '!', language: key });
    } else {
      callback(404);
    }
  },

  notFound: (data, callback) => {
    callback(404);
  }
};

// Define a router.
const router = {
  hello: handlers.hello
};
