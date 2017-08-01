// Grab .env file if there is one
require('dotenv').config();

// This will be our application entry. We'll setup our server here.
const app = require('./server/express'); // The express app we just created

const port = parseInt(process.env.PORT, 10) || 3001;
app.set('port', port);

app.listen(app.get('port'), () => {
  console.log(`Find the server at: http://localhost:${app.get('port')}/`); // eslint-disable-line no-console
});
