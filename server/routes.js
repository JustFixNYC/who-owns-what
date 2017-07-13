const router = require('express').Router();

const contacts = require('./controllers/contacts');
const bizAddresses = require('./controllers/bizAddresses');

router.get('/api/contacts', contacts.query);
router.get('/api/bizaddresses', bizAddresses.query);

// Setup a default catch-all route that sends back a welcome message in JSON format.
// router.get('*', (req, res) => res.status(200).send({
//   message: 'Welcome to the beginning of nothingness.',
// }));

module.exports = router;
