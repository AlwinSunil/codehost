# CodeHost Request Handler

1. Install Docker and Docker Compose
2. Create `.env` file according to `.env.example`
3. Setup the domain ssl certificate

4. Install certbot `sudo apt install -y certbot python3-certbot-nginx`

5. Install Certbot with a DNS Plugin
   Replace `cloudflare` with the DNS provider you use (e.g., `digitalocean`, `route53`, etc.):

    ```bash
    sudo apt install -y python3-certbot-dns-cloudflare
    ```

6. **Create API Credentials for DNS Provider**

    - Obtain the API token or credentials from your DNS provider.
    - Save the credentials in a file, e.g., `~/.secrets/certbot/cloudflare.ini`:
        ```ini
        dns_cloudflare_api_token = YOUR_API_TOKEN
        ```
    - Secure the credentials file: (Read only for the current user)
        ```bash
        chmod 600 ~/.secrets/certbot/cloudflare.ini
        ```

7. **Request the Wildcard Certificate**  
   Use the following command to request the certificate with the DNS plugin:

    ```bash
    sudo certbot certonly \
        --dns-cloudflare \
        --dns-cloudflare-credentials ~/.secrets/certbot/cloudflare.ini \
        -d *.example.com -d example.com \
        --agree-tos --no-eff-email --email your-email@example.com
    ```

8. **Verify Renewal**  
   Test the renewal process:

    ```bash
    sudo certbot renew --dry-run
    ```

9. **Run Docker Compose to start request-handler**
    ```bash
    docker-compose up -d
    ```

10. Change cloud VM settings to allow HTTP and HTTPS traffic

11. Update the DNS records for the domain to point to the VM's IP address