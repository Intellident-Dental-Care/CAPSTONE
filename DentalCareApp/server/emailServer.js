require('dotenv').config({ path: '../.env' });
const express = require('express');
const emailjs = require('@emailjs/nodejs');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { getLocalIpAddress, getServerDiscoveryUrls } = require('./getServerUrl');
const os = require('os');

const app = express();
const PORT = process.env.PORT || process.env.EMAIL_SERVER_PORT || 5001;

// ==========================================
// 1. INITIALIZATION & MIDDLEWARE
// ==========================================
const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const LOCAL_IP = getLocalIpAddress();
console.log('Detected local IP:', LOCAL_IP);

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

// ==========================================
// 2. API ROUTERS (Registered First)
// ==========================================
const timelineRoute = require('./HistoryModel/3DTimeline');

app.use('/api/3d-timeline', timelineRoute);

console.log('Email server starting with EmailJS...');

// ==========================================
// 4. OTP & VERIFICATION ROUTES
// ==========================================
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

app.post('/send-verification', async (req, res) => {
  console.log('Received verification email request:', req.body);
  const { email, fullName, userId } = req.body;

  if (!email || !fullName || !userId) {
    console.log('Missing required fields:', { email: !!email, fullName: !!fullName, userId: !!userId });
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); 
    console.log('Generated OTP:', otp, 'Expires at:', otpExpiresAt);

    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    let upsertError;

    if (checkError && checkError.code === 'PGRST116') {
      console.log('User profile does not exist. Creating new user record.');
      const { error: insertError } = await supabase.from('users').insert({
        id: userId,
        email: email,
        full_name: fullName,
        verification_otp: otp,
        otp_expires_at: otpExpiresAt.toISOString(),
        is_verified: false,
        created_at: new Date().toISOString()
      });
      upsertError = insertError;
    } else if (!checkError && existingUser) {
      console.log('User profile exists. Updating OTP.');
      const { error: updateError } = await supabase.from('users').update({
        verification_otp: otp,
        otp_expires_at: otpExpiresAt.toISOString()
      }).eq('id', userId);
      upsertError = updateError;
    } else {
      upsertError = checkError;
    }

    if (upsertError) {
      console.error('Failed to store OTP:', upsertError);
      return res.status(500).json({ error: 'Failed to store verification code', details: upsertError.message });
    }

    const templateParams = {
      to_email: email,
      fullName: fullName,
      otp: otp
    };

    console.log('Sending OTP email to:', email);
    const info = await emailjs.send(
      process.env.EMAILJS_SERVICE_ID,
      process.env.EMAILJS_TEMPLATE_ID,
      templateParams,
      {
        publicKey: process.env.EMAILJS_PUBLIC_KEY,
        privateKey: process.env.EMAILJS_PRIVATE_KEY,
      }
    );
    console.log('OTP email sent successfully');
    
    res.json({ success: true, message: 'Verification code sent to your email' });
  } catch (error) {
    // UPDATED ERROR LOGGING
    const errorDetails = error.text || error.message || JSON.stringify(error) || 'Unknown EmailJS Error';
    console.error('Email sending error:', errorDetails);
    res.status(500).json({ error: 'Failed to send verification code', details: errorDetails });
  }
});

app.post('/resend-otp', async (req, res) => {
  console.log('Received OTP resend request:', req.body);
  const { email, fullName, userId } = req.body;

  if (!email || !fullName || !userId) {
    console.log('Missing required fields:', { email: !!email, fullName: !!fullName, userId: !!userId });
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); 
    console.log('Generated new OTP:', otp, 'Expires at:', otpExpiresAt);

    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    let updateError;

    if (checkError && checkError.code === 'PGRST116') {
      console.log('User profile does not exist. Creating new user record for resend.');
      const { error: insertError } = await supabase.from('users').insert({
        id: userId,
        email: email,
        full_name: fullName,
        verification_otp: otp,
        otp_expires_at: otpExpiresAt.toISOString(),
        is_verified: false,
        created_at: new Date().toISOString()
      });
      updateError = insertError;
    } else if (!checkError && existingUser) {
      console.log('User profile exists. Updating OTP for resend.');
      const { error: uError } = await supabase.from('users').update({
        verification_otp: otp,
        otp_expires_at: otpExpiresAt.toISOString()
      }).eq('id', userId);
      updateError = uError;
    } else {
      updateError = checkError;
    }

    if (updateError) {
      console.error('Failed to update OTP:', updateError);
      return res.status(500).json({ error: 'Failed to update verification code', details: updateError.message });
    }

    const templateParams = {
      to_email: email,
      fullName: fullName,
      otp: otp
    };

    console.log('Sending new OTP email to:', email);
    const info = await emailjs.send(
      process.env.EMAILJS_SERVICE_ID,
      process.env.EMAILJS_TEMPLATE_ID,
      templateParams,
      {
        publicKey: process.env.EMAILJS_PUBLIC_KEY,
        privateKey: process.env.EMAILJS_PRIVATE_KEY,
      }
    );
    console.log('New OTP email sent successfully');
    
    res.json({ success: true, message: 'New verification code sent to your email' });
  } catch (error) {
    // UPDATED ERROR LOGGING
    const errorDetails = error.text || error.message || JSON.stringify(error) || 'Unknown EmailJS Error';
    console.error('Resend OTP error:', errorDetails);
    res.status(500).json({ error: 'Failed to resend verification code', details: errorDetails });
  }
});

app.post('/verify-otp', async (req, res) => {
  const { userId, otp } = req.body;

  if (!userId || !otp) {
    return res.status(400).json({ error: 'Missing userId or OTP' });
  }

  try {
    console.log('Verifying OTP for user:', userId, 'OTP:', otp);

    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('verification_otp, otp_expires_at, is_verified')
      .eq('id', userId)
      .single();

    if (fetchError || !userData) {
      console.error('User not found:', fetchError);
      return res.status(404).json({ error: 'User not found' });
    }

    if (userData.is_verified) {
      return res.json({ success: true, message: 'Email already verified' });
    }

    if (userData.verification_otp !== otp) {
      console.log('OTP mismatch. Expected:', userData.verification_otp, 'Received:', otp);
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    const now = new Date();
    const expiresAt = new Date(userData.otp_expires_at);
    if (now > expiresAt) {
      console.log('OTP expired. Current time:', now, 'Expires at:', expiresAt);
      return res.status(400).json({ error: 'Verification code has expired' });
    }

    const { error: updateError } = await supabase.from('users').update({
      is_verified: true,
      verification_otp: null,
      otp_expires_at: null
    }).eq('id', userId);

    if (updateError) {
      console.error('Failed to update user verification status:', updateError);
      return res.status(500).json({ error: 'Failed to verify email' });
    }

    console.log('User successfully verified:', userId);
    res.json({ success: true, message: 'Email verified successfully' });

  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ error: 'Failed to verify code', details: error.message });
  }
});

// ==========================================
// 5. SERVER UTILITY & DISCOVERY ROUTES
// ==========================================
app.get('/server-discovery', (req, res) => {
  const discoveryInfo = getServerDiscoveryUrls();
  const serverUrl = `http://${LOCAL_IP}:${PORT}`;
  console.log('[SERVER-DISCOVERY] Sending detected IP:', LOCAL_IP, 'URL:', serverUrl);
  
  res.json({
    success: true,
    serverInfo: {
      currentIP: LOCAL_IP,
      currentUrl: serverUrl,
      port: PORT,
      timestamp: new Date().toISOString(),
      requestFrom: req.ip,
      ...discoveryInfo
    }
  });
});

app.get('/network-info', (req, res) => {
  res.json({
    localIP: LOCAL_IP,
    port: PORT,
    serverUrl: `http://${LOCAL_IP}:${PORT}`,
    timestamp: new Date().toISOString(),
  });
});

app.get('/server-info', (req, res) => {
  res.json({ ip: LOCAL_IP, port: PORT, emailServerUrl: `http://${LOCAL_IP}:${PORT}` });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', server: `${LOCAL_IP}:${PORT}`, timestamp: new Date().toISOString() });
});

app.get('/test', (req, res) => {
  console.log('Test request received from:', req.ip);
  res.json({ message: 'Email server is working!', server: `${LOCAL_IP}:${PORT}`, timestamp: new Date().toISOString() });
});

// ==========================================
// 6. SERVER LISTENER
// ==========================================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Email server running on port ${PORT}`);
  console.log(`Server accessible at: http://${LOCAL_IP}:${PORT}`);
  console.log(`Test endpoint: http://${LOCAL_IP}:${PORT}/test`);
  console.log(`Server discovery: http://${LOCAL_IP}:${PORT}/server-discovery`);
  console.log(`Health check: http://${LOCAL_IP}:${PORT}/health`);
  console.log(`Network interfaces detected:`);
  
  const interfaces = os.networkInterfaces();
  for (const interfaceName in interfaces) {
    const networkInterface = interfaces[interfaceName];
    for (const connection of networkInterface) {
      if (!connection.internal && connection.family === 'IPv4') {
        console.log(`   - ${interfaceName}: http://${connection.address}:${PORT}`);
      }
    }
  }
  
  console.log(`Email server ready to receive requests!`);
  console.log(`If client can't find server, try: http://${LOCAL_IP}:${PORT}/test in browser`);
});

// Handle unexpected crashes so the port doesn't hang
process.on('uncaughtException', (err) => {
  console.error('There was an uncaught error:', err);
  process.exit(1); 
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('Shutting down server gracefully...');
  process.exit(0);
});