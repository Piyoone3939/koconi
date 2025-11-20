# nginx/Dockerfile
FROM nginx:alpine

# 標準の設定削除（不要ならスキップ可）
RUN rm /etc/nginx/conf.d/default.conf

# 自作の設定をコピー
COPY default.conf /etc/nginx/conf.d/default.conf

# 静的ファイルはcomposeでマウントされるのでここでは不要
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]