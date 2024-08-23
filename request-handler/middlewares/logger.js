const logger = (req, res, next) => {
	const hostname = req.hostname;
	const subdomain = hostname.split(".")[0];
	const start = Date.now(); // Record the start time

	res.on("finish", () => {
		const duration = Date.now() - start; // Calculate the duration
		console.log(
			`${req.method} ${req.url} - ${res.statusCode} - ${subdomain} in ${duration}ms`
		);
	});

	next();
};

export default logger;
