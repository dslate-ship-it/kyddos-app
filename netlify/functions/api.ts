import app from '../../src/index'

export default async function handler(request: Request, context: unknown) {
  const url = new URL(request.url)

  // Netlify redirects /api/* to /.netlify/functions/api/*.
  // Normalize both shapes so the existing Hono routes keep working unchanged.
  if (url.pathname.startsWith('/.netlify/functions/api/')) {
    url.pathname = url.pathname.replace('/.netlify/functions/api/', '/api/')
  } else if (url.pathname === '/.netlify/functions/api') {
    url.pathname = '/api/bootstrap'
  }

  return app.fetch(new Request(url.toString(), request), { context })
}
