import httpProxy from "http-proxy";

const BASE_PATH =
	"https://codehost-test.s3.eu-north-1.amazonaws.com/_deployments";
const proxy = httpProxy.createProxyServer();

const getTargetUrl = async (prisma, subdomain) => {
	try {
		const project = await prisma.project.findUnique({
			where: { subdomain },
		});
		return project ? `${BASE_PATH}/${project.id}/` : null;
	} catch (err) {
		console.error("Database error:", err);
		return null;
	}
};

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
						next(); // Move to next middleware or route
					}
				}
			);
		} else {
			next(); // Move to next middleware or route
		}
	};
};

export default proxyRoutes;
