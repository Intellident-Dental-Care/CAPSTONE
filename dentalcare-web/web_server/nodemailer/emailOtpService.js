import nodemailer from "nodemailer";

const getTransporter = () => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) {
    throw new Error("Missing EMAIL_USER or EMAIL_PASS");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });
};

export const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendOtpEmail = async ({ email, fullName, otp, role }) => {
  const emailUser = process.env.EMAIL_USER;
  const transporter = getTransporter();

  const mailOptions = {
    from: emailUser,
    to: email,
    subject: `Your ${role} verification code - GC Dental Care`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #222;">
        <h2>Hi ${fullName || "there"},</h2>
        <p>Your one-time verification code is:</p>
        <p style="font-size: 32px; letter-spacing: 6px; font-weight: 700; color: #e91e63;">${otp}</p>
        <p>This code expires in 10 minutes.</p>
        <p>If you did not request this, you can ignore this email.</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

export const verifyEmailTransport = async () => {
  const transporter = getTransporter();
  return transporter.verify();
};
