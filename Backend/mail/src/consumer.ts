import amqp from 'amqplib'
import nodemailer from 'nodemailer'

export const startSendOtpConsumer = async()=>{
    try {
        const connection = await amqp.connect({
            protocol: "amqp",
            hostname: process.env.RABBITMQ_HOST || "",
            port: 5672,
            username: process.env.RABBITMQ_USERNAME || "",
            password: process.env.RABBITMQ_PASSWORD || ""
        });

        const channel = await connection.createChannel();

        const queueName = "send-otp";

        await channel.assertQueue(queueName,{durable:true});

        console.log("✅Mail Service consumer started, listening for otp emails");
        
        channel.consume(queueName,async(msg)=>{
            if(msg){
                try {
                    const {to, subject, body} = JSON.parse(msg.content.toString());

                    const transporter = nodemailer.createTransport({
                        host: "smtp.gmail.com",
                        port: 465,
                        auth: {
                            user: process.env.MAILSERVICEUSER,
                            pass: process.env.MAILSERVICEPASSWORD
                        },
                    })

                    await transporter.sendMail({
                        from: "Chat App",
                        to:to,
                        subject:subject,
                        text:body,
                    })

                    console.log(`OTP mail sent to ${to}`);
                    channel.ack(msg);

                } catch (error) {
                    console.log("Failed to send OTP",error);
                    
                }
            }
        })

    } catch (error) {
        console.log("Failed to listen for otp emails", error);  
    }
}
