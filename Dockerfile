# 使用官方Node.js镜像作为基础镜像
FROM node:18-alpine

# 安装基本工具和依赖
RUN apk add --no-cache fontconfig ttf-dejavu curl wget unzip

# 添加更多字体
RUN apk add --no-cache --repository http://dl-cdn.alpinelinux.org/alpine/edge/testing/ \
    font-noto font-noto-cjk ttf-liberation msttcorefonts-installer

# 运行msttcorefonts安装器 (包含Script MT Bold类似字体)
RUN update-ms-fonts

# 安装更多装饰性字体
RUN mkdir -p /usr/share/fonts/truetype/google-fonts

# 下载和安装Google Fonts中类似Playwrite的字体
RUN wget -O pacifico.zip "https://fonts.google.com/download?family=Pacifico" && \
    unzip pacifico.zip -d /usr/share/fonts/truetype/google-fonts && \
    rm pacifico.zip

RUN wget -O dancing.zip "https://fonts.google.com/download?family=Dancing%20Script" && \
    unzip dancing.zip -d /usr/share/fonts/truetype/google-fonts && \
    rm dancing.zip

RUN wget -O satisfy.zip "https://fonts.google.com/download?family=Satisfy" && \
    unzip satisfy.zip -d /usr/share/fonts/truetype/google-fonts && \
    rm satisfy.zip

# 更新字体缓存
RUN fc-cache -fv

# 创建工作目录
WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm ci

# 复制所有文件到工作目录
COPY . .

# 构建Next.js应用
RUN npm run build

# 暴露端口
EXPOSE 8080

# 设置环境变量
ENV PORT=8080
ENV NODE_ENV=production

# 启动应用
CMD ["npm", "start"] 