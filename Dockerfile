# Static hosting for Fortrex (works with Coolify's Dockerfile build pack)
FROM nginx:1.27-alpine
COPY dist/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
