import nodemailer from 'nodemailer'

let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth:{
        user: 'juleeperween34@gmail.com',
        pass: 'hhrdakkperekcfre',
    }
});

const resetURL = `<p>Enter <b></b> in the app to verify your email address and complete<p>This code <b>expires in 1 hour</b>.</P>`;


const sendMailEnvoice = async function (order){
    let info = await transporter.sendMail({
        from: 'juleeperween34@gmail.com', // sender address
        to: '20btcs050hy@manuu.edu.in',
        text: "hey user",
        subject: "Order accepted",
        html:invoiceTemplate(order)
      });
    return info;  
}


const invoiceTemplate = function(order){

 return ( `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice</title>
        <style>
            /* Add your CSS styles here */
            body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 0;
            }
            .container {
                width: 80%;
                margin: 20px auto;
                border: 1px solid #ccc;
                padding: 20px;
            }
            .invoice-header {
                text-align: center;
                margin-bottom: 20px;
            }
            .invoice-body {
                margin-bottom: 20px;
            }
            .invoice-footer {
                text-align: center;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="invoice-header">
                <h1>Invoice</h1>
            </div>
            <div class="invoice-body">
            <p><strong>Order ID:</strong> ${order._id}</p>
            <p><strong>User ID:</strong> ${order.userId}</p>
            <p><strong>Total Amount:</strong> ${order.paymentIntent.amount}</p>
            <p><strong>Payment Method:</strong> ${order.paymentIntent.method}</p>
            <p><strong>Status:</strong> ${order.orderStatus}</p>
            <p><strong>Date:</strong> ${new Date(order.paymentIntent.created).toLocaleDateString()}</p>
            </div>
            <div class="invoice-footer">
                <p>Thank you for your purchase!</p>
            </div>
        </div>
    </body>
    </html>`
    
 )


}

export { sendMailEnvoice } 