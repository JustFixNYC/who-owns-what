const router = require('express').Router();

const reg = require('./controllers/registrations');

router.get('*', reg.hello);

// Setup a default catch-all route that sends back a welcome message in JSON format.
// router.get('*', (req, res) => res.status(200).send({
//   message: 'Welcome to the beginning of nothingness.',
// }));

module.exports = router;
