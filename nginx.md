server {
    server_name api.betwisepicks.com;

        location / {
            proxy_pass http://3.76.70.78:8001;
            proxy_http_version 1.1;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            client_max_body_size 20M; # Adjust the value based on your needs
        }

        error_page 404 /404.html;
        location = /404.html {
            root /var/www/errors;

    }
}

server {
    listen 80;
    server_name betwisepicks.com https://www.betwisepicks.com;

    location / {
        proxy_pass http://3.76.70.78:8002;
        proxy_http_version 1.1;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 20M; # Adjust the value based on your needs
    }

        error_page 404 /404.html;
        location = /404.html {
            root /var/www/errors;

    }
}

server {
    server_name admin.betwisepicks.com;

        location / {
            proxy_pass http://3.76.70.78:4173;
            proxy_http_version 1.1;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            client_max_body_size 20M; # Adjust the value based on your needs
        }

        error_page 404 /404.html;
        location = /404.html {
            root /var/www/errors;

    }
}
