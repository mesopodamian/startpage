# Very small and secure NGINX base
FROM nginx:alpine

# Remove the default Nginx welcome page
RUN rm -rf /usr/share/nginx/html/*

# Copy all site files into the web root
COPY . /usr/share/nginx/html

# Expose port 80 (inside the container)
EXPOSE 80

# NGINX runs automatically via entrypoint
