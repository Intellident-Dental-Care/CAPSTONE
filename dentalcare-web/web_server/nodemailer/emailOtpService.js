import nodemailer from "nodemailer";

const getTransporter = () => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  if (!emailUser || !emailPass) throw new Error("Missing EMAIL_USER or EMAIL_PASS");

  return nodemailer.createTransport({
    service: "gmail",
    auth: { user: emailUser, pass: emailPass },
  });
};

// Fixed export to resolve SyntaxError in routes.js
export const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendOtpEmail = async ({ email, fullName, otp, role, tempPassword }) => {
  const emailUser = process.env.EMAIL_USER;
  const transporter = getTransporter();

  const subject = tempPassword 
    ? `Welcome to GC Dental Care - Your ${role} Account Details`
    : `Your ${role} verification code - GC Dental Care`;

  const htmlContent = tempPassword ? `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
        <h2 style="color: #e91e63;">Welcome, ${fullName || "there"}!</h2>
        <p>An administrator has created a <strong>${role}</strong> account for you. Use the details below to log in.</p>
        <div style="background-color: #fff5f8; padding: 20px; border-radius: 8px; border: 1px solid #ffd1df; margin: 20px 0;">
          <p style="margin: 0 0 10px 0;"><strong>Email:</strong> ${email}</p>
          <p style="margin: 0 0 10px 0;"><strong>Password:</strong> <span style="font-family: monospace; background: #fff; padding: 2px 6px; border: 1px solid #ddd;">${tempPassword}</span></p>
          <p style="margin: 0;"><strong>OTP:</strong> <span style="font-size: 20px; font-weight: bold; color: #e91e63; letter-spacing: 2px;">${otp}</span></p>
        </div>
        <p style="font-size: 14px; color: #666;"><em>Note: Provide this OTP during your first login to verify your account.</em></p>
      </div>
  ` : `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #222;">
        <h2>Hi ${fullName || "there"},</h2>
        <p>Your one-time verification code is: <strong style="color: #e91e63;">${otp}</strong></p>
        <p>This code expires in 10 minutes.</p>
      </div>
  `;

  return transporter.sendMail({ from: `"GC Dental Care" <${emailUser}>`, to: email, subject, html: htmlContent });
};

export const verifyEmailTransport = async () => getTransporter().verify();