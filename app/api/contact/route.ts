
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { ratelimit } from '@/lib/rate-limiter';

const resend = new Resend(process.env.RESEND_API_KEY);

export const runtime = 'edge';

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') ?? '127.0.0.1';

  try {
    const { success, limit, remaining, reset } = await ratelimit.limit(ip);

    if (!success) {
      return new NextResponse('Too many requests. Please try again later.', {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
        },
      });
    }

    const { name, email, subject, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json(
        { success: false, error: 'Name, email, and message are required.' },
        { status: 400 }
      );
    }

    await resend.emails.send({
      from: 'Portfolio Contact <onboarding@resend.dev>', // Must be a verified domain
      to: process.env.CONTACT_TO || '',
      replyTo: email,
      subject: subject || 'New Contact Form Message',
      html: `
        <h2>New Contact Message from ${name}</h2>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
        <hr>
        <p><small>Sent at ${new Date().toLocaleString()}</small></p>
        <p><small>User IP: ${ip}</small></p>
      `,
    });

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error('Resend API error:', err);
    if (err instanceof Error) {
        console.error(err);
    }
    return NextResponse.json(
      { success: false, error: 'Failed to send email.' },
      { status: 500 }
    );
  }
}
