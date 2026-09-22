import { loadConfig, parseHttpAddr } from './config';
import { Runner } from './runner';
import { createServer } from './server';

function main(): void {
	const cfg = loadConfig();
	const { host, port } = parseHttpAddr(cfg.httpAddr);

	const runner = new Runner(cfg);
	runner.start();

	const server = createServer(runner);
	server.listen(port, host, () => {
		console.log(`canary health endpoint listening on ${host}:${port}`);
	});

	const shutdown = () => {
		console.log('canary shutting down');
		runner.stop();
		server.close(() => process.exit(0));
		setTimeout(() => process.exit(0), 10_000).unref();
	};
	process.on('SIGINT', shutdown);
	process.on('SIGTERM', shutdown);
}

main();
