// const passport = require("passport");
// const GoogleStrategy = require("passport-google-oauth20");
// const keys = require("./keys");
// const User = require("../models/userModel");

// passport.serializeUser((user, done) => {
//   done(null, user.id);
// });

// passport.deserializeUser((id, done) => {
//   User.findById(id).then((user) => {
//     done(null, id);
//   });
// });

// passport.use(
//   new GoogleStrategy(
//     {
//       // options for the strategy.
//       callbackURL: "/auth/google/redirect",
//       clientID: keys.google.clientID,
//       clientSecret: keys.google.clientSecret,
//     },
//     (accessToken, refreshToken, profile, done) => {
//       // check if user exists
//       User.findOne({ email: profile.emails[0].value }).then((currentUser) => {
//         if (currentUser) {
//           // user exists.
//           console.log(`user is ${currentUser.name}`);
//           //   done(null, currentUser);

//           passport.use(
//             new GoogleStrategy(
//               {
//                 // options for the strategy.
//                 callbackURL: "/auth/google/redirect",
//                 clientID: keys.google.clientID,
//                 clientSecret: keys.google.clientSecret,
//               },
//               (accessToken, refreshToken, profile, done) => {
//                 // check if user exists
//                 User.findOne({ email: profile.emails[0].value }).then(
//                   (currentUser) => {
//                     if (currentUser) {
//                       // user exists.
//                       console.log(`user is ${currentUser.name}`);
//                       done(null, currentUser);
//                     } else {
//                       // create new user.
//                       new User({
//                         name: profile.displayName,
//                         email: profile.emails[0].value,
//                       })
//                         .save()
//                         .then((newUser) => {
//                           console.log(`new user created: ${newUser}`);
//                           done(null, newUser);
//                         });
//                     }
//                   }
//                 );
//               }
//             )
//           );
//         } else {
//           // create new user.
//           new User({
//             name: profile.displayName,
//             email: profile.emails[0].value,
//           })
//             .save()
//             .then((newUser) => {
//               console.log(`new user created: ${newUser}`);
//               done(null, newUser);
//             });
//         }
//       });
//     }
//   )
// );

const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy; // Import GoogleStrategy
const keys = require("./keys");
const User = require("../models/userModel");

// Serialize user to session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser((id, done) => {
  User.findById(id)
    .then((user) => {
      done(null, user); // Pass the user object to done
    })
    .catch((err) => {
      done(err, null); // Handle errors
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
      // Check if user exists in the database
      User.findOne({ email: profile.emails[0].value })
        .then((currentUser) => {
          if (currentUser) {
            // User exists, pass it to done
            console.log(`user is ${currentUser.name}`);
            done(null, currentUser);
          } else {
            // User does not exist, create a new user
            new User({
              name: profile.displayName,
              email: profile.emails[0].value,
            })
              .save()
              .then((newUser) => {
                console.log(`new user created: ${newUser}`);
                done(null, newUser);
              })
              .catch((err) => {
                done(err, null); // Handle errors
              });
          }
        })
        .catch((err) => {
          done(err, null); // Handle errors
        });
    }
  )
);

module.exports = passport;
