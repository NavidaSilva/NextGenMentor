const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const SCOPES = [
  //'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/calendar',
  // other scopes you might want
];

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_REDIRECT_URI
  },
  (accessToken, refreshToken, profile, done) => {
    // Extract the relevant profile information
    const user = {
      id: profile.id,
      displayName: profile.displayName,
      email: profile.emails[0].value,
           accessToken,     
      refreshToken,     
    };
    return done(null, user);
  }
));