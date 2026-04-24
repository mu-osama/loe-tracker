import { promises as fs } from 'fs';
import path from 'path';

const DOCS_BUILD_DIR = path.resolve(process.cwd(), '../docs/build');

const MIME_TYPES: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function getContentType(filePath: string) {
  return MIME_TYPES[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream';
}

async function resolveDocsFile(slugParts?: string[]) {
  const safeParts = (slugParts ?? []).filter(Boolean);
  const basePath = path.resolve(DOCS_BUILD_DIR, ...safeParts);

  const candidates = safeParts.length === 0 || !path.extname(basePath)
    ? [path.join(basePath, 'index.html'), `${basePath}.html`, basePath]
    : [basePath];

  for (const candidate of candidates) {
    const resolved = path.resolve(candidate);
    if (!resolved.startsWith(DOCS_BUILD_DIR)) {
      continue;
    }

    try {
      const stats = await fs.stat(resolved);
      if (stats.isFile()) {
        return resolved;
      }
    } catch {
      // Try the next candidate.
    }
  }

  return null;
}

function docsNotBuiltResponse() {
  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Documentation not built</title>
    <style>
      body {
        margin: 0;
        font-family: "Segoe UI", sans-serif;
        background: #f6f4ef;
        color: #163228;
      }
      main {
        max-width: 720px;
        margin: 64px auto;
        background: white;
        border-radius: 20px;
        padding: 32px;
        box-shadow: 0 24px 60px rgba(22, 50, 40, 0.12);
      }
      code {
        background: #eef4f0;
        padding: 2px 6px;
        border-radius: 6px;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>Documentation is not built yet</h1>
      <p>Run <code>npm run docs:build</code> from the repository root, then refresh <code>/docs</code>.</p>
    </main>
  </body>
</html>`;

  return new Response(html, {
    status: 503,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

export async function GET(
  _request: Request,
  { params }: { params: { slug?: string[] } },
) {
  try {
    await fs.access(DOCS_BUILD_DIR);
  } catch {
    return docsNotBuiltResponse();
  }

  const filePath = await resolveDocsFile(params.slug);
  if (!filePath) {
    return new Response('Not found', { status: 404 });
  }

  const file = await fs.readFile(filePath);

  return new Response(file, {
    headers: {
      'Content-Type': getContentType(filePath),
      'Cache-Control': filePath.endsWith('.html') ? 'no-cache' : 'public, max-age=31536000, immutable',
    },
  });
}
