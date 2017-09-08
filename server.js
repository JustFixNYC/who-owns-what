// Grab .env file if there is one
require('dotenv').config();

let app;

// This will be our application entry. We'll setup our server here.
if(process.env.NODE_ENV !== 'production') {
  app = require('./server/express');
} else {
  app = require('./dist/express');
}

const port = parseInt(process.env.PORT, 10) || 3001;
app.set('port', port);

app.listen(app.get('port'), () => {
  console.log(`Find the server at: http://localhost:${app.get('port')}/`); // eslint-disable-line no-console
});
