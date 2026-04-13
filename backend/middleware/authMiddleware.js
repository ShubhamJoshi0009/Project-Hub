const jwt = require('jsonwebtoken');
const supabase = require('../supabaseClient');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', decoded.id)
        .single();

      if (error || !profile) {
        console.error('Auth Middleware: Profile not found for ID:', decoded.id, error);
        return res.status(401).json({ message: 'Not authorized, profile not found' });
      }

      req.user = profile;
      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

module.exports = { protect };
