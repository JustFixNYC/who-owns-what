const db = require('../services/db');

module.exports = {
  hello(req, res) {
    db.getRegistration()
      .then(reg => res.status(201).send(reg))
      .catch(error => res.status(400).send(error));
  },
};
