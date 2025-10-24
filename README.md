# React + TypeScript + Vite


## Deployment

When you're ready to deploy your Vite application to production, there are some key steps you can take to ensure it runs as efficiently as possible.


```bash
$ nvm use 22
$ sudo mkdir -p /opt/rfid
$ sudo chown -R $USER:$USER /opt/rfid
$ cd /opt/rfid
$ git clone https://github.com/mehdiparastar/rfid-frontend.git
$ sudo chown -R $USER:$USER /opt/rfid/rfid-frontend
$ cd rfid-frontend
$ npm ci
$ npm run build
$ NODE_OPTIONS="--max-old-space-size=512" npm run build  # if you have memory limitation
$ sudo cp -r /opt/rfid/rfid-frontend/dist /var/www/rfid-frontend
$ sudo chown -R www-data:www-data /var/www/rfid-frontend
$ sudo chmod -R 755 /var/www/rfid-frontend
```

### below steps are related to NGINX configs without SSL
```bash
$ sudo apt install nginx
$ sudo nano /etc/nginx/sites-available/default  # then pase config below:


↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓
    server {
        listen 80;
        server_name _;  # You can set a domain or keep it as is for LAN use

        # Set maximum allowed size for uploaded files
        client_max_body_size 800M;  # Adjust this value as needed (e.g., 50M for 50MB)

        # Serve static files from the dist directory
        root /var/www/rfid-frontend/dist;  # New path to the dist directory
        index index.html;

        # Serve the Vite app
        location / {
            try_files $uri $uri/ /index.html;
        }

        # Reverse proxy for API requests
        location /api/ {
            proxy_pass http://127.0.0.1:7219;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header Cookie $http_cookie;  # Ensure cookies are passed to backend
        }

        # Reverse proxy for socket.io
        location /socket.io/ {
            proxy_pass http://127.0.0.1:7219;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header Cookie $http_cookie;  # Ensure cookies are passed to backend
        }
    }
↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑
```

if in your nestjs app used `secure:true`, you should enable ssl on nginx config. the above config is related to below state.
```bash
↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓
      cookieBase = {
          httpOnly: true,
          sameSite: "lax" as const,          // CSRF-friendly for SPA
          secure: false, 
          path: "/",
      };  
↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑


$ sudo nginx -t
$ sudo systemctl restart nginx
$ sudo ufw allow 'Nginx Full'
```



### below steps are related to NGINX configs with SSL

#### firstly use Avahi to enable mDNS feature in LAN network.

  - Step 1: Install Avahi
    - Update packages and install the daemon plus utilities:
    ```bash
    sudo apt update
    sudo apt install avahi-daemon avahi-utils
    ```
  - Step 2: Configure Avahi
    - Edit the config to set your hostname and enable publishing:
    ```bash
    sudo nano /etc/avahi/avahi-daemon.conf
    ````
    Then replace thisand Save and exit (Ctrl+O, Enter, Ctrl+X).
    ```bash
    [server]
    host-name=tagnama
    domain-name=local
    use-ipv4=yes
    use-ipv6=yes
    ratelimit-interval-usec=1000000
    ratelimit-burst=1000

    [wide-area]
    enable-wide-area=yes

    [publish]
    publish-addresses=yes
    publish-hinfo=yes
    publish-workstation=yes
    publish-domain=yes

    [reflector]

    [rlimits]
    ```
  - Step 3: Start and Enable the Service
    ```bash
    sudo systemctl daemon-reload
    sudo systemctl enable avahi-daemon
    sudo systemctl start avahi-daemon
    ```
    - Check status: `sudo systemctl status avahi-daemon` (should show "active (running)").
    - If errors, check logs: `sudo journalctl -u avahi-daemon -f`.

  - Step 4: Firewall Adjustments (If Using UFW)
    - Allow mDNS traffic (UDP port 5353 multicast):
    ```bash
    sudo ufw allow in 5353/udp
    sudo ufw reload
    ```
    - For your LAN-only setup, this is safe. If using iptables, add: sudo iptables -A INPUT -p udp --dport 5353 -j ACCEPT.

  - Step 5: Test mDNS

    - On the Banana Pi: `avahi-resolve -n tagnama.local` (should resolve to your IP).
    - From another LAN device (PC/Mac/Linux):
      - Ping: `ping tagnama.local` (resolves to Banana Pi's IP).
    - Browse services: 
      - Install Avahi utils if needed (e.g., `sudo apt install avahi-utils` on Linux), then avahi-browse -a (lists all mDNS services; look for your hostname).
Access your app: https://tagnama.local (accept self-signed cert warning).

    - Windows Note: mDNS (.local) works natively if Bonjour is installed (comes with iTunes or download from Apple). Otherwise, use a tool like "Bonjour Print Services for Windows."
Mac/Linux: Built-in support via ping hostname.local.
  - Troubleshooting

    - No Resolution: 
      - Ensure all devices on the same subnet (no VLANs). 
      - Restart Avahi: `sudo systemctl restart avahi-daemon`.
    - Hostname Conflicts: 
      - If "tagnama.local" doesn't work, try a unique name. Check `/etc/hostname` and sync: `sudo hostnamectl set-hostname tagnama`.
      - Armbian-Specific: Recent Armbian versions (post-2023) have Avahi optional by default. If on older (e.g., Stretch), update to latest: `sudo armbian-config > System > Update`.
    - Discovery Issues: 
      - Run `sudo avahi-daemon --check` to verify no errors.
    - Logs: `sudo tail -f /var/log/syslog | grep avahi for real-time debugging`.


#### secondly use this nginX config:
  - Step 1: 
    - Generate a Self-Signed SSL Certificate
      - Since you're using a local mDNS domain (`tagnama.local`), you can't use public CAs like Let's Encrypt (they require a publicly resolvable domain). 
      - A self-signed certificate is the simplest option for local/LAN use. 
      - Browsers will show a security warning, but you can proceed by accepting the exception (or manually trust the cert in your browser's settings for a smoother experience).
    - Run these commands on your Banana Pi to generate the cert and key:
      ```bash
      # Create a directory for certs (optional, but organized)
      sudo mkdir -p /etc/nginx/ssl

      # Generate the private key and self-signed cert
      # -x509: Self-signed cert
      # -nodes: No passphrase (for simplicity in local setup)
      # -days 365: Valid for 1 year (adjust as needed)
      # -newkey rsa:2048: Use RSA 2048-bit key
      sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/nginx/ssl/tagnama.local.key \
        -out /etc/nginx/ssl/tagnama.local.crt \
        -subj "/C=IR/ST=East Azerbaijan/L=Tabriz/O=Local/CN=tagnama.local"

      # Set secure permissions
      sudo chmod 600 /etc/nginx/ssl/tagnama.local.key
      sudo chown root:www-data /etc/nginx/ssl/tagnama.local.key  # Assuming nginx runs as www-data
      ```
      - Notes on the subject:

        - C=IR: Country (Iran).
        - ST=East Azerbaijan: State/Province (your region).
        - L=Tabriz: Locality (your city).
        - O=Local: Organization (custom).
        - CN=tagnama.local: Common Name (must match your mDNS domain).

      - This creates `tagnama.local.crt` (certificate) and `tagnama.local.key` (private key).


  - Step 2: Update Your Nginx Configuration for SSL
    - Edit the config file to enable HTTPS. We'll:
      - Listen on port 443 for HTTPS.
      - Redirect all HTTP (port 80) traffic to HTTPS.
      - Use the self-signed certs.
      - Keep your existing proxy rules intact.

    - Run:
      ```bash
      sudo nano /etc/nginx/sites-available/default
      ```

    - Replace the entire content with this updated config (pastes in your existing blocks with SSL additions):
      ```bash
      server {
          listen 80;
          server_name tagnama.local;  # Use your mDNS domain explicitly for redirects
          return 301 https://$server_name$request_uri;  # Redirect all HTTP to HTTPS
      }

      server {
          listen 443 ssl http2;  # Enable SSL and HTTP/2
          server_name tagnama.local;  # Match your mDNS domain

          # SSL Certificate Paths
          ssl_certificate /etc/nginx/ssl/tagnama.local.crt;
          ssl_certificate_key /etc/nginx/ssl/tagnama.local.key;

          # SSL Security Recommendations (basic hardening for local use)
          ssl_protocols TLSv1.2 TLSv1.3;
          ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384;
          ssl_prefer_server_ciphers off;
          ssl_session_cache shared:SSL:10m;

          # Set maximum allowed size for uploaded files
          client_max_body_size 800M;  # Adjust this value as needed (e.g., 50M for 50MB)

          # Serve static files from the dist directory
          root /var/www/rfid-frontend/dist;  # New path to the dist directory
          index index.html;

          # Serve the Vite app
          location / {
              try_files $uri $uri/ /index.html;
          }

          # Reverse proxy for API requests
          location /api/ {
              proxy_pass http://127.0.0.1:7219;
              proxy_http_version 1.1;
              proxy_set_header Upgrade $http_upgrade;
              proxy_set_header Connection 'upgrade';
              proxy_set_header Host $host;
              proxy_cache_bypass $http_upgrade;
              proxy_set_header X-Real-IP $remote_addr;
              proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
              proxy_set_header X-Forwarded-Proto $scheme;
              proxy_set_header Cookie $http_cookie;  # Ensure cookies are passed to backend
          }

          # Reverse proxy for socket.io
          location /socket.io/ {
              proxy_pass http://127.0.0.1:7219;
              proxy_http_version 1.1;
              proxy_set_header Upgrade $http_upgrade;
              proxy_set_header Connection 'upgrade';
              proxy_set_header Host $host;
              proxy_cache_bypass $http_upgrade;
              proxy_set_header X-Real-IP $remote_addr;
              proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
              proxy_set_header X-Forwarded-Proto $scheme;
              proxy_set_header Cookie $http_cookie;  # Ensure cookies are passed to backend
          }
      }
      ```
      - Key Changes:
        - Added a separate server block for port 80 that redirects to HTTPS.
        - Enabled ssl and http2 on port 443.
        - Pointed to your new cert/key files.
        - Changed server_name _; to `tagnama.local` for specificity (works with mDNS).
        - Added basic SSL ciphers/protocols for security (local-friendly, no need for HSTS yet).
      - Save and exit (Ctrl+O, Enter, Ctrl+X).

  - Step 3: Test and Restart Nginx

    ```bash
    sudo nginx -t  # Test config for syntax errors
    sudo systemctl restart nginx  # Restart to apply changes
    ```
    If tests pass, check status:
    ```bash
    sudo systemctl status nginx
    ```
    Update your firewall to allow HTTPS:
    ```bash
    sudo ufw allow 'Nginx Full'  # Already done, but this covers 80+443
    sudo ufw status  # Verify
    ```

  - Step 4: Update Your NestJS App for Secure Cookies
    - In your NestJS code, change `secure: false` to `secure: true` since Nginx now handles HTTPS:

    ```bash
          cookieBase = {
              httpOnly: true,
              sameSite: "lax" as const,          // CSRF-friendly for SPA
              secure: process.env.NODE_ENV === "production",
              path: "/",
          };  
    ```

  - Step 5: Access and Trust the Certificate

    - On your local network devices, ensure mDNS is enabled (Avahi on Linux, Bonjour on macOS/Windows).
    - Access via: https://tagnama.local 
      - Browser warning: 
        - Click `"Advanced" > "Proceed to tagnama.local (unsafe)"` (Chrome/Edge). 
        - For Firefox, add an exception.
      
      - To avoid warnings permanently (optional, local only):

        - Export the `.crt` file: `sudo cp /etc/nginx/ssl/tagnama.local.crt ~/Downloads/`
        - Install it in your browser's trusted roots:

          - Chrome: `Settings > Privacy > Manage certificates > Import the .crt as "Trusted Root"`.
          - Firefox: `Settings > Privacy > View Certificates > Import`.
        
        

#### Now other devices in the same LAN should be able to access your app by navigating to the device’s IP in the browser. Example: `http://<Device_IP>` or `https://tagnama.local`


#
This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
