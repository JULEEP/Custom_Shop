import sentEmail from "../Controller/emailCtrl.js";



const sendOTPVerification = async (user, otp) => {
  try {
    // Constructing the HTML content for the email
    const resetURL = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; text-align: left;">
      <!-- Welcome text below Image1 -->
      <div style="text-align: center;">
        <p style="font-size: 1.2em; font-weight: bold;">Welcome to fakeShop! Let’s Get Shopping</p>
      </div>
      <!-- Underline -->
      <hr style="border: none; height: 1px; background-color: #000; margin: 10px 0;">
      <!-- OTP verification message -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
        <!-- Verification text -->
        <div style="width: 100%; text-align: left; padding-left: 10px;">
          <p>We're thrilled to have you on board. To ensure your account's security, we need to verify your email address.</p>
          <p>Please use the following One-Time Password (OTP) to complete your signup process:</p>
          <p><strong style="font-size: 1.5em;">${otp}</strong></p>
          <p>If you didn't request this OTP, please disregard this email.</p>
          <p>If you have any questions or need further assistance, feel free to reach out to our support team at <a href="mailto:care@fakeshop.ae">care@fakeshop.ae</a>.</p>
          <!-- Button with capsule shape -->
          <a href="https://fakeshop.com" style="display: inline-block; background-color: blue; color: white; text-decoration: none; padding: 10px 20px; border-radius: 25px;">Start Shopping!</a>
        </div>
      </div>
      <!-- Another underline -->
      <hr style="border: none; height: 1px; background-color: #000; margin: 10px 0;">
      <!-- Team fakeShop -->
      <p style="font-size: 0.8em;">Copyright (C) 2023-2024 fakeShop. All rights reserved.</p>
      <p>Our mailing address is: care@fakeshop.ae</p>
      <p>Want to change how you receive these emails?</p>
      <p>You can update your preferences or unsubscribe.</p>
      <!-- Additional sections -->
      <p>Happy exploring!</p>
      <p>Best regards,<br/>Team fakeShop</p>
    </div>
 `;

    // Data object for the email
    const data = {
      to: user.email,
      text: "Hey user",
      subject: "Verify your email",
      html: resetURL,
    };

    // Sending the email
    await sentEmail(data); // Assuming sentEmail is a function to send emails
  } catch (error) {
    throw new Error(error);
  }
};



// Function to resend OTP for user
const resendOTPForUser = async (user, otp) => {
  try {
    // Create email content with the new OTP
    const emailContent = `
      <p>Hello</p>
      <p>We received a request to resend your One-Time Password (OTP). Please use the OTP below to complete your email verification:</p>
      <p>OTP: <b>${otp}</b></p>
      <p>If you did not request this OTP, please ignore this email.</p>
      <p>Thank you,<br/>Team fakeShop</p>
    `;

    // Set up email data
    const emailData = {
      to: user.email,
      text: "Hey User",
      subject: 'Resend OTP for Email Verification',
      html: emailContent,
    };

    // Send the email
    sentEmail(emailData);

    console.log(`OTP resent to user: ${user.email}`);
  } catch (error) {
    console.error(`Error resending OTP to user: ${error.message}`);
    // Rethrow the error for the caller to handle
    throw new Error('Failed to resend OTP');
  }
};




export {
  sendOTPVerification,
  resendOTPForUser
}
