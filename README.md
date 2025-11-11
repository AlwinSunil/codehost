# CodeHost
![CodeHost Demo](https://miro.medium.com/v2/resize:fit:4800/format:webp/1*cG2BhmP1QW3tmnV0a8lZKg.gif)

CodeHost is a platform for deployment of frontend web applications built with Vite.js and Create React App, with support for environment variables at build time.

By [Alwin Sunil](https://alwinsunil.in)

## Components and Architecture

1. `client` Application
    - Built with Next.js 15 and deployed on Vercel
    - Prisma ORM for database access
2. Build task workflow
    - User action in the `client` application send's a message to an AWS SQS queue.
    - Triggers `lambda/trigger-build-task` function .
    - This function reads the message from the `queue`, and creates a build task in the `request-handler` service in AWS ECS.
    - The build task is a docker container running the `request-handler` service.
    - Fetchs the project details and builds the application.
    - Uploads the build artifacts to Cloudflare R2.
3. `request-handler` service
    - Built with Node.js with Nginx.
    - On request to sites, proxys build articfacts from Cloudflare R2 to serve the site
    - Used Manged Redis for caching subdomain-to-build artifact mapping.
    - Runs on AWS EC2 `t2.micro` instance. As this app is stateless, can be scaled later with help of k8s if required.

## Performance Considerations

While CodeHost is deployed using free-tier services from various providers, we can further optimize the deployment by adding Kubernetes (K8s) infront of the request handler and use Fargate for the build task, instead of EC2 t2.micro auto scaling group.

## Read More

First post about [CodeHost](https://medium.com/@alwins/day-one-building-codehost-decc5c08ceaf).
To read more about the project, check out my blog at [medium/@alwins](https://medium.com/@alwins)
