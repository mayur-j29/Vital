const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./models/db');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

passport.use(
  new LocalStrategy(
    { usernameField: 'email', passwordField: 'password', session: false },
    async (email, password, done) => {
      try {
        const result = await db.execute({
          sql: 'SELECT * FROM users WHERE email = ?',
          args: [email]
        });
        const user = result.rows[0];
        if (!user) {
          return done(null, false, { message: 'Invalid email or password' });
        }
        const match = await bcrypt.compare(password, user.password_hash);
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

passport.deserializeUser(async (id, done) => {
  try {
    const result = await db.execute({
      sql: 'SELECT * FROM users WHERE id = ?',
      args: [id]
    });
    const user = result.rows[0];
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