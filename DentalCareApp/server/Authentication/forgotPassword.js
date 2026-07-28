const { createClient } = require('@supabase/supabase-js');

// Initialize with Service Role to bypass the old password requirement
const supabaseAdmin = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Receives generateOTP and sendEmailJS from emailServer.js
const requestPasswordReset = async (req, res, generateOTP, sendEmailJS) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    // 1. Validate user exists
    const { data: user, error: checkError } = await supabaseAdmin
      .from('users')
      .select('id, full_name')
      .eq('email', email)
      .single();

    if (checkError || !user) {
      return res.status(404).json({ error: 'No account found with this email' });
    }

    // 2. Generate OTP using emailServer.js's logic
    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); 

    // 3. Store OTP
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        verification_otp: otp,
        otp_expires_at: otpExpiresAt.toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Failed to store OTP:', updateError);
      return res.status(500).json({ error: 'Database error' });
    }

    // 4. Send Email using emailServer.js's logic
    await sendEmailJS(email, user.full_name || 'User', otp);
    
    res.json({ success: true, message: 'Reset code sent to your email' });

  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
};

const changePassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // 1. Fetch user to verify OTP
    const { data: user, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('id, verification_otp, otp_expires_at')
      .eq('email', email)
      .single();

    if (fetchError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.verification_otp !== otp) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    if (new Date() > new Date(user.otp_expires_at)) {
      return res.status(400).json({ error: 'Verification code has expired' });
    }

    // 2. Update password via Auth Admin API
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (authError) {
      console.error('Supabase Auth error:', authError);
      return res.status(500).json({ error: 'Failed to update password' });
    }

    // 3. Clean up OTP
    await supabaseAdmin
      .from('users')
      .update({
        verification_otp: null,
        otp_expires_at: null
      })
      .eq('id', user.id);

    res.json({ success: true, message: 'Password reset successfully' });

  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
};

module.exports = {
  requestPasswordReset,
  changePassword
};