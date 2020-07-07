// NOTE: This Server export is deprecated!
// We will be removing from the codebase soon.

const mailchimp = require("../services/mailchimp");

const LISTID = process.env.MAILCHIMP_LISTID;
const emailSuccess = { msg: "Email subscribed successfully." };

module.exports = {
  send: (req, res) => {
    mailchimp
      .subscribe(req.body.email, LISTID)
      .then((mcres) => {
        res.send(emailSuccess);
      })
      .catch((e) => {
        if (e.error.title === "Member Exists") {
          return res.send(emailSuccess);
        }
        // console.log(e.error.title);
        return res.sendStatus(500);
      });
  },
};
