require('dotenv').config({ path: '../.env' });
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { getLocalIpAddress, getServerDiscoveryUrls } = require('./getServerUrl');

const app = express();
const PORT = process.env.EMAIL_SERVER_PORT || 5001;

// Initialize Supabase client
const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const LOCAL_IP = getLocalIpAddress();
console.log('Detected local IP:', LOCAL_IP);

app.use(cors());
app.use(express.json());

console.log('Email server starting...');
console.log('EMAIL_USER configured:', !!process.env.EMAIL_USER);
console.log('EMAIL_PASS configured:', !!process.env.EMAIL_PASS);
console.log('FRONTEND_URL:', process.env.FRONTEND_URL);

// Create transporter using environment variables
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Test transporter connection
transporter.verify((error, success) => {
  if (error) {
    console.log('Email transporter verification failed:', error);
  } else {
    console.log('Email transporter is ready to send emails');
  }
});

// Function to generate 6-digit OTP
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
    // Generate 6-digit OTP
    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
    
    console.log('Generated OTP:', otp, 'Expires at:', otpExpiresAt);

    // Store OTP in database
    const { error: updateError } = await supabase
      .from('users')
      .update({
        verification_otp: otp,
        otp_expires_at: otpExpiresAt.toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Failed to store OTP:', updateError);
      return res.status(500).json({ error: 'Failed to store verification code' });
    }

    // Send OTP via email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your Verification Code - Dental Care App',
      html: `
        <h2>Welcome ${fullName}!</h2>
        <p>Your email verification code is:</p>
        <h1 style="font-size: 32px; color: #e91e63; text-align: center; letter-spacing: 5px; margin: 20px 0;">${otp}</h1>
        <p><strong>This code will expire in 10 minutes.</strong></p>
        <p>Enter this code in the app to verify your email address.</p>
        <p>If you didn't create this account, please ignore this email.</p>
      `,
    };

    console.log('Sending OTP email to:', email);
    
    const info = await transporter.sendMail(mailOptions);
    console.log('OTP email sent successfully:', info.messageId);
    
    res.json({ 
      success: true, 
      message: 'Verification code sent to your email', 
      messageId: info.messageId 
    });
  } catch (error) {
    console.error('Email sending error:', error);
    res.status(500).json({ error: 'Failed to send verification code', details: error.message });
  }
});

// Add endpoint to verify OTP
app.post('/verify-otp', async (req, res) => {
  const { userId, otp } = req.body;

  if (!userId || !otp) {
    return res.status(400).json({ error: 'Missing userId or OTP' });
  }

  try {
    console.log('Verifying OTP for user:', userId, 'OTP:', otp);

    // Get user's stored OTP and expiry
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('verification_otp, otp_expires_at, is_verified')
      .eq('id', userId)
      .single();

    if (fetchError || !userData) {
      console.error('User not found:', fetchError);
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already verified
    if (userData.is_verified) {
      return res.json({ success: true, message: 'Email already verified' });
    }

    // Check if OTP matches
    if (userData.verification_otp !== otp) {
      console.log('OTP mismatch. Expected:', userData.verification_otp, 'Received:', otp);
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    // Check if OTP has expired
    const now = new Date();
    const expiresAt = new Date(userData.otp_expires_at);
    if (now > expiresAt) {
      console.log('OTP expired. Current time:', now, 'Expires at:', expiresAt);
      return res.status(400).json({ error: 'Verification code has expired' });
    }

    // Mark user as verified and clear OTP
    const { error: updateError } = await supabase
      .from('users')
      .update({
        is_verified: true,
        verification_otp: null,
        otp_expires_at: null
      })
      .eq('id', userId);

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

// Add endpoint to get server discovery information
app.get('/server-discovery', (req, res) => {
  const discoveryInfo = getServerDiscoveryUrls();
  res.json({
    success: true,
    serverInfo: {
      currentIP: LOCAL_IP,
      currentUrl: `http://${LOCAL_IP}:${PORT}`,
      port: PORT,
      ...discoveryInfo
    }
  });
});

// Keep existing /server-info endpoint for backward compatibility
app.get('/server-info', (req, res) => {
  res.json({ 
    ip: LOCAL_IP, 
    port: PORT,
    emailServerUrl: `http://${LOCAL_IP}:${PORT}`
  });
});

app.listen(PORT, () => {
  console.log(`Email server running on port ${PORT}`);
  console.log(`Server accessible at: http://${LOCAL_IP}:${PORT}`);
});
