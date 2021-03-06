'use strict';



/**
 * config file for passport.js
 */ 

// load dependencies
const LocalStrategy = require('passport-local').Strategy,
User = require('../app/models/userModel');



// expose this function to our app using module.exports
module.exports = function(passport) {

    // for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });


    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });



    /**
     * strategy for local signup
     */
    passport.use('local-signup', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) {

        // asynchronous
        // User.findOne wont fire unless data is sent back
        process.nextTick( () => {

            // check if user email already exists in DB
            User.findOne({ 'local.email' :  email }, (err, user) => {
                // if there are any errors, return the error
                if (err)
                    return done(err);

                // email exists in DB
                if (user) {
                    return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
                } else {

                    // email does not exist in DB
                    // create the user
                    let newUser = new User();

                    // set the user's local credentials
                    newUser.local.email    = email;
                    newUser.local.password = newUser.generateHash(password);
                    newUser.local.firstName = req.body.firstName;

                    // save the user
                    newUser.save( err => {
                        if (err)
                            throw err;
                        return done(null, newUser);
                    });
                }

            });    

        });

    }));



    /**
     * strategy for local login
     */
    passport.use('local-login', new LocalStrategy({
        // overide default
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true
    },
    function(req, email, password, done){

        // User.findOne won't fire unless data is sent back
        process.nextTick( () => {

            // find user with the email
            User.findOne({ 'local.email': email }, (err, user) => {
                // if error, return the error
                if(err){
                    return done(err);
                }

                // user does not exist
                if(!user){
                    return done(null, false, req.flash('loginMessage', 'Incorrect Email'));
                }
                
                // password wrong
                if (!user.validPassword(password)){
                    return done(null, false, req.flash('loginMessage', 'Incorrect Password'))
                }
                
                // all is well, return successful user
                return done(null, user);

            });

        })

    }));

};
