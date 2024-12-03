export async function GET(request) {
  const env = process.env.NODE_ENV;
  console.log('Environment:', env);

  try {
    console.log('NEXT_PUBLIC_HELLO:', process.env.NEXT_PUBLIC_HELLO);
    console.log('HELLO:', process.env.HELLO);

    return new Response(
      JSON.stringify({
        environment: env,
        next_public_hello: process.env.NEXT_PUBLIC_HELLO,
        hello: process.env.HELLO,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error accessing environment variables:', error);
    return new Response(JSON.stringify({ error: 'Error accessing environment variables' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
