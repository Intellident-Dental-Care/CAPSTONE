import emailjs from '@emailjs/nodejs';

export const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendOtpEmail = async ({ email, fullName, otp, role, tempPassword }) => {
  console.log('Preparing to send email to:', email);

  const templateParams = {
    to_email: email,
    fullName: fullName || "there",
    role: role,
    otp: otp,
    tempPassword: tempPassword
  };

  // Automatically routes to the correct EmailJS template
  const templateId = tempPassword 
    ? process.env.EMAILJS_TEMPLATE_ID_NEW_ACCOUNT 
    : process.env.EMAILJS_TEMPLATE_ID;            

  try {
    const info = await emailjs.send(
      process.env.EMAILJS_SERVICE_ID,
      templateId,
      templateParams,
      {
        publicKey: process.env.EMAILJS_PUBLIC_KEY,
        privateKey: process.env.EMAILJS_PRIVATE_KEY,
      }
    );
    console.log('Email sent successfully via EmailJS');
    return info;
  } catch (error) {
    const errorDetails = error.text || error.message || JSON.stringify(error) || 'Unknown EmailJS Error';
    console.error('Email sending error:', errorDetails);
    throw new Error(errorDetails);
  }
};

export const verifyEmailTransport = async () => true;