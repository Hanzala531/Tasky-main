import nodemailer from "nodemailer";

const otpStore = new Map(); // email -> { otp, expiresAt }

export const sendOtpByEmail = async (toEmail) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes from now

  // Save to in-memory store
  otpStore.set(toEmail, { otp, expiresAt });

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"Your App" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: "OTP verification for your account",
    text: `You are trying to register on owr website and here is your OTP code : ${otp}. It expires in 5 minutes.`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP sent to ${toEmail}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to send OTP om :",toEmail , error.message);
    return { success: false, error: error.message };
  }
};

export const verifyOtp = (email, enteredOtp) => {
  const record = otpStore.get(email);

  if (!record) {
    return { success: false, message: "No OTP found for this email." };
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(email);
    return { success: false, message: "OTP has expired." };
  }

  if (record.otp !== enteredOtp) {
    return { success: false, message: "Incorrect OTP." };
  }

  // Valid OTP
  otpStore.delete(email); // Optional: Remove after use
  return { success: true, message: "OTP verified successfully." };
};
