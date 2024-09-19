import httpProxy from "http-proxy";
import { Redis } from "@upstash/redis";

const redis = new Redis({
	url: process.env.UPSTASH_REDIS_URL,
	token: process.env.UPSTASH_REDIS_TOKEN,
});

const BASE_PATH =
	"https://codehost-prod.s3.ap-south-1.amazonaws.com/_deployments";
const proxy = httpProxy.createProxyServer();

const getTargetUrl = async (prisma, subdomain) => {
	try {
		const cachedProjectId = await redis.get(subdomain);

		if (cachedProjectId) {
			console.log("From cache:", cachedProjectId);
			return `${BASE_PATH}/${cachedProjectId}/`;
		}

		const project = await prisma.project.findUnique({
			where: { subdomain },
			select: {
				id: true,
				subdomain: true,
			},
		});
		console.log("From DB:", project?.id);

		if (project) {
			await redis.set(subdomain, project.id, { ex: 172800 });

			return `${BASE_PATH}/${project.id}/`;
		}

		return null;
	} catch (err) {
		console.error("Error fetching target URL:", err);
		return null;
	}
};

// Proxy route handler
const proxyRoutes = (prisma) => {
	return async (req, res, next) => {
		const subdomain = req.hostname.split(".")[0];
		const targetUrl = await getTargetUrl(prisma, subdomain);

		if (targetUrl) {
			if (req.url === "/") req.url = "/index.html";

			proxy.web(
				req,
				res,
				{ target: targetUrl, changeOrigin: true },
				(err) => {
					if (err) {
						console.error("Proxy error:", err);
						next();
					}
				}
			);
		} else {
			next();
		}
	};
};

export default proxyRoutes;
