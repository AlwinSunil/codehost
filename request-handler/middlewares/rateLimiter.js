import rateLimit from "express-rate-limit";

const rateLimiter = rateLimit({
	windowMs: 1 * 60 * 1000, // 1 minute
	max: 20, // limit each IP to 20 requests per windowMs
	message: "Too many requests from this IP, please try again later.",
});

export default rateLimiter;
