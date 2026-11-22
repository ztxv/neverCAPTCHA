import {createReadStream} from 'node:fs';
import {stat} from 'node:fs/promises';
import {createServer} from 'node:http';
import {extname, resolve, sep} from 'node:path';
import {fileURLToPath} from 'node:url';

const project = fileURLToPath(new URL('../', import.meta.url));
const production = process.argv.includes('--production');
const roots = (production ? ['dist'] : ['src', 'public']).map(folder => resolve(project, folder));
const portFlag = process.argv.indexOf('--port');
const port = Number(portFlag >= 0 ? process.argv[portFlag + 1] : process.env.PORT || 5173);
const host = process.env.HOST || '127.0.0.1';
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
};

if (!Number.isInteger(port) || port < 0 || port > 65535) {
  throw new Error('PORT or --port must be an integer from 0 to 65535.');
}

const server = createServer(async (request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, {'Allow': 'GET, HEAD'}).end('Method not allowed');
    return;
  }
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  } catch {
    response.writeHead(400).end('Invalid URL');
    return;
  }
  if (pathname.endsWith('/')) pathname += 'index.html';

  for (const root of roots) {
    const filename = resolve(root, '.' + pathname);
    if (!filename.startsWith(root + sep)) continue;
    let info;
    try {
      info = await stat(filename);
    } catch {
      continue;
    }
    if (!info.isFile()) continue;
    response.writeHead(200, {
      'Content-Type': types[extname(filename)] || 'application/octet-stream',
      'Content-Length': info.size,
      'Cache-Control': 'no-store',
    });
    if (request.method === 'HEAD') response.end();
    else createReadStream(filename).pipe(response);
    return;
  }
  response.writeHead(404, {'Content-Type': 'text/plain; charset=utf-8'}).end('Not found');
});

server.on('error', error => {
  console.error(error.code === 'EADDRINUSE'
    ? `Port ${port} is busy. Try: npm run dev -- --port ${port + 1}`
    : error.message);
  process.exitCode = 1;
});
server.listen(port, host, () => {
  console.log(`NeverCAPTCHA ${production ? 'build preview' : 'development'}: http://${host}:${server.address().port}`);
});
