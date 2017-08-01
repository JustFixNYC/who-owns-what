const router = require('express').Router();

const contacts = require('./controllers/contacts');
const landlords = require('./controllers/landlords');

router.get('/contacts', contacts.query);
router.get('/landlords', landlords.query);

module.exports = router;
