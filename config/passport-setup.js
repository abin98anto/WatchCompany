const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy; // Import GoogleStrategy
const { keys } = require("./keys");
const User = require("../models/userModel");


// Serialize user to session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser((id, done) => {
  User.findById(id)
    .then((user) => {
      done(null, user);
    })
    .catch((err) => {
      done(err, null);
    });
});

// Configure Google OAuth2.0 strategy
passport.use(
  new GoogleStrategy(
    {
      callbackURL: "/auth/google/redirect",
      clientID: keys.google.clientID,
      clientSecret: keys.google.clientSecret,
    },
    (accessToken, refreshToken, profile, done) => {
      User.findOne({ email: profile.emails[0].value })
        .then((currentUser) => {
          if (currentUser) {
            // console.log(`user is ${currentUser.name}`);
            done(null, currentUser);
          } else {
            new User({
              name: profile.displayName,
              email: profile.emails[0].value,
            })
              .save()
              .then((newUser) => {
                // console.log(`new user created: ${newUser}`);
                done(null, newUser);
              })
              .catch((err) => {
                done(err, null);
              });
          }
        })
        .catch((err) => {
          done(err, null);
        });
    }
  )
);

module.exports = passport;
