import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { config } from "../config";

if (config.googleClientId && config.googleClientSecret) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: config.googleClientId,
        clientSecret: config.googleClientSecret,
        callbackURL: `${config.backendUrl}/auth/google/callback`,
      },
      (_accessToken, _refreshToken, profile, done) => {
        const user = {
          id: profile.id,
          displayName: profile.displayName,
          email: profile.emails?.[0]?.value,
          avatar: profile.photos?.[0]?.value,
        };
        return done(null, user);
      }
    )
  );
} else {
  console.warn(
    "⚠️  GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not set — Google OAuth disabled"
  );
}

export default passport;
