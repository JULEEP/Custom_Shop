import asyncHandler from 'express-async-handler'
import nodemailer from 'nodemailer'


const sentEmail = asyncHandler(async( data, req, res) => {
  const transporter =  nodemailer.createTransport({
    service: 'gmail',
    auth:{
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
    }
})


//2.configure email content.
const mailOptions = {
    from:process.env.EMAIL,
    to: data.to,
    subject: data.subject,
    text: data.text,
    html: data.html,
}

//3. send email
try {
   const result = await transporter.sendMail(mailOptions);
   console.log('Eamil sent successfully')
} catch (error) {
    console.log('Email send failed with error:', error)
}

})


export default sentEmail