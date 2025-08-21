import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const { name, email, subject, message } = await req.json();

    // Create reusable transporter object
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: true, // true = 465, false = 587
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Send mail
    await transporter.sendMail({
      from: `"${name}" <${process.env.SMTP_USER}>`, // sender
      to: process.env.CONTACT_TO, // your inbox
      replyTo: email, // user’s email for reply
      subject: subject || "New Contact Form Message",
      text: message,
      html: `
        <h2>New Contact Message</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong> ${message}</p>
        <p><small>Sent at ${new Date().toLocaleString()}</small></p>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Nodemailer error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to send email" },
      { status: 500 }
    );
  }
}
