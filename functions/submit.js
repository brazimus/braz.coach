/**
 * Cloudflare Worker for handling contact form submissions.
 *
 * This function is triggered when a POST request is made to the `/submit` URL on your site.
 * It expects form data with `name`, `email`, `subject`, and `message`.
 * It uses the forwardemail.net API to send the email.
 *
 * Environment variables that must be set in your Cloudflare Pages project settings:
 * - FORWARDEMAIL_USERNAME: Your email address on forwardemail.net (e.g., yourname@yourdomain.com).
 * - FORWARDEMAIL_PASSWORD: A generated password from your forwardemail.net account dashboard.
 * - TO_EMAIL: The email address that will receive the form submissions.
 */
export async function onRequestPost({ request, env }) {
  try {
    const formData = await request.formData();
    const body = Object.fromEntries(formData);

    // --- Basic Validation ---
    if (!body.name || !body.email || !body.subject || !body.message) {
      return new Response(JSON.stringify({ success: false, message: 'Missing required fields.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // --- Construct forwardemail.net API Payload as JSON ---
    const apiPayload = {
      to: [env.TO_EMAIL], // API expects an array of emails
      from: `"${body.name}" <${env.FORWARDEMAIL_USERNAME}>`,
      replyTo: `"${body.name}" <${body.email}>`,
      subject: `New Contact Form Submission: ${body.subject}`,
      html: `
        <p>You have received a new message from your website contact form.</p>
        <hr>
        <p><b>Name:</b> ${body.name}</p>
        <p><b>Email:</b> ${body.email}</p>
        <hr>
        <p><b>Message:</b></p>
        <p>${body.message.replace(/\n/g, '<br>')}</p>
      `,
    };

    // --- Create Basic Auth Header ---
    const basicAuth = btoa(`${env.FORWARDEMAIL_USERNAME}:${env.FORWARDEMAIL_PASSWORD}`);

    // --- Send the email via forwardemail.net API ---
    const apiRequest = new Request('https://api.forwardemail.net/v1/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/json', // Send as JSON
      },
      body: JSON.stringify(apiPayload), // Stringify the JSON payload
    });

    const apiResponse = await fetch(apiRequest);

    if (!apiResponse.ok) {
      // Log the error for debugging in Cloudflare dashboard
      console.error(`forwardemail.net API Error: ${apiResponse.status} ${apiResponse.statusText}`);
      const errorBody = await apiResponse.text();
      console.error(`forwardemail.net Response Body: ${errorBody}`);
      
      return new Response(JSON.stringify({ success: false, message: 'Failed to send email.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // The original form's client-side script expects a simple 'OK' for success.
    // We will return that for compatibility.
    return new Response('OK', { status: 200 });

  } catch (error) {
    console.error('Worker Error:', error);
    return new Response(JSON.stringify({ success: false, message: 'An unexpected error occurred.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
