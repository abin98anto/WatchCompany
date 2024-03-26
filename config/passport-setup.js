/*
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20");
const keys = require("./keys");
const User = require("../models/userModel");

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id).then((user) => {
    done(null, user.id);
  });
});

passport.use(
  new GoogleStrategy(
    {
      // options for strategy.
      callbackURL: "/auth/google/redirect",
      clientID: keys.google.clientID,
      clientSecret: keys.google.clientSecret,
    },
    (accessToken, refreshToken, profile, done) => {
      // check if the user exists
      User.findOne({ email: profile.emails[0].value }).then((currentUser) => {
        if (currentUser) {
          console.log(`user is ${currentUser}`);
          done(null, currentUser);
        } else {
          new User({
            name: profile.name.givenName,
            email: profile.emails[0].value,
          })
            .save()
            .then((newUser) => {
              console.log("new user created:" + newUser);
              done(null, newUser);
            });
        }
      });
    }
  )
);
*/

const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20");
const FacebookStrategy = require("passport-facebook");
const keys = require("./keys");

passport.use(
  new GoogleStrategy(
    {
      // options for google strat.
      callbackURL:'/auth/google/redirect',
      clientID: keys.google.clientID,
      clientSecret: keys.google.clientSecret,
    },
    () => {
      // passport callback function.
    }
  )
);

passport.use(
  new FacebookStrategy(
    {
      //options for facebook strat.
    },
    () => {
      // passport callback function.
    }
  )
);
