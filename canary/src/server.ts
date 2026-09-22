import http from 'node:http';
import type { Runner } from './runner';

export function createServer(runner: Runner): http.Server {
	return http.createServer((req, res) => {
		if (req.method === 'GET' && req.url === '/healthz') {
			const status = runner.status();
			res.setHeader('Content-Type', 'application/json; charset=utf-8');
			res.statusCode = status.status === 'healthy' ? 200 : 503;
			res.end(JSON.stringify(status));
			return;
		}
		if (req.method === 'GET' && req.url === '/livez') {
			res.setHeader('Content-Type', 'application/json; charset=utf-8');
			res.statusCode = 200;
			res.end(JSON.stringify({ status: 'ok' }));
			return;
		}
		res.statusCode = 404;
		res.end();
	});
}
