const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./models/db');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

const findUserByEmailStmt = db.prepare('SELECT * FROM users WHERE email = ?');

passport.use(
  new LocalStrategy(
    { usernameField: 'email', passwordField: 'password', session: false },
    (email, password, done) => {
      try {
        const user = findUserByEmailStmt.get(email);
        if (!user) {
          return done(null, false, { message: 'Invalid email or password' });
        }
        const match = bcrypt.compareSync(password, user.password_hash);
        if (!match) {
          return done(null, false, { message: 'Invalid email or password' });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  try {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    const user = stmt.get(id);
    done(null, user || false);
  } catch (err) {
    done(err);
  }
});

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

module.exports = {
  passport,
  generateToken
};

