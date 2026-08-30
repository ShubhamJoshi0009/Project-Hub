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
        // Auto-heal profile from Supabase Auth if record was missing in profiles table
        try {
          const { data: authUser } = await supabase.auth.admin.getUserById(decoded.id);
          if (authUser?.user) {
            const { data: healedProfile } = await supabase
              .from('profiles')
              .upsert([{
                id: decoded.id,
                name: authUser.user.user_metadata?.name || authUser.user.email.split('@')[0],
                email: authUser.user.email
              }], { onConflict: 'id' })
              .select()
              .single();

            if (healedProfile) {
              req.user = healedProfile;
              return next();
            }
          }
        } catch (healErr) {
          console.warn('Profile auto-heal notice:', healErr.message);
        }

        console.error('Auth Middleware: Profile not found for ID:', decoded.id, error);
        return res.status(401).json({ message: 'Not authorized, profile not found' });
      }

      req.user = profile;
      next();
    } catch (error) {
      console.error('Auth Middleware Error:', error.message);
      return res.status(401).json({ message: 'Not authorized, token invalid or expired' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

module.exports = { protect };
