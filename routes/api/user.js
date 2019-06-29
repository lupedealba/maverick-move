const router = require('express').Router();
const bcrypt = require("bcryptjs"); // bcyrpt helps you hash(chop up) passwords
const jwt = require('jsonwebtoken');
const keys = require("../../configs/key");
const passport = require("passport") // helps authenticate requests through a set of plugins called strategies
const LocalStratgy = require("passport-local").Strategy;
const User = require("../../model/user");

router.get('/', (req, res) => {
    User.find()
        .then(users => res.json(users));
});

router.post('/register', (req, res) => {

    User.findOne({ email: req.body.email }).then(user => {
        if (user) {
            return res.status(400).json({ email: 'Email Already Exists' });
        }
        const newUser = new User({
            name: req.body.name,
            email: req.body.email,
            password: req.body.password
        });
        // Hashing password before saving in database
        // a salt is random data that is used as an additional input to a one-way function that "hashes" data, a password or passphrase.
        bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(newUser.password, salt, (err, hash) => {
                if (err) throw err;
                newUser.password = hash;
                newUser
                    .save()
                    .then(user => res.json(user))
                    .catch(err => console.log(err));
            });
        });
    });
});

passport.use(new LocalStratgy({
    usernameField: 'email',
    passwordField: 'password'
},
    function (email, password, done) {
        User.findOne({ email: email }, function (err, user) {
            if (err) { return done(err); }
            if (!user) {
                return done(null, false, { message: 'Incorrect Email.' });
            }
            bcrypt.compare(password, user.password).then(isMatch => {
                if (isMatch) {
                    return done(null, user);
                } else {
                    return done(null, false, { message: 'Incorrect password.' });
                }
            });

        });

    }

));
// Passport takes that user id and stores it internally on req.session.passport which is passport’s internal mechanism to keep track of things.
passport.serializeUser(function (user, done) {
    done(null, user.id);
});
// This is where the user profile is attached to the request handler at req.user. Then finally after all this occurs, the user is routed back to the /login/(name of site)/return route handler where we can finally access the user profile information on req.user.
passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});

router.post('/login', function (req, res, next) {

    passport.authenticate('local', function (err, user, info) {

        if (err) { return next(err); }
        if (!user) { return res.status(400).json({ message: info.message }); }
        req.logIn(user, function (err) {
            if (err) { return next(err); }
            return res.json({ id: req.user.id, email: req.user.email });
        });
    })(req, res, next);
});
router.get('/logout', (req, res) => {
    req.logout();
    res.sendStatus(200);
});

module.exports = routes;