# 使用官方Node.js镜像作为基础镜像
FROM node:18-alpine

# 安装基本工具和依赖
RUN apk add --no-cache fontconfig ttf-dejavu git

# 添加更多字体
RUN apk add --no-cache --repository http://dl-cdn.alpinelinux.org/alpine/edge/testing/ \
    font-noto font-noto-cjk ttf-liberation font-noto-extra \
    ttf-font-awesome terminus-font ttf-opensans font-bakoma \
    && apk add --no-cache --repository http://dl-cdn.alpinelinux.org/alpine/edge/community/ \
    ttf-hack ttf-inconsolata font-fantasque-sans 

# 创建字体目录
RUN mkdir -p /usr/share/fonts/truetype/custom

# 直接下载单个TTF字体文件 (更可靠的方法)
# 手写风格字体: Pacifico
RUN wget -O /usr/share/fonts/truetype/custom/pacifico.ttf "https://github.com/google/fonts/raw/main/ofl/pacifico/Pacifico-Regular.ttf"
# 手写风格字体: Satisfy
RUN wget -O /usr/share/fonts/truetype/custom/satisfy.ttf "https://github.com/google/fonts/raw/main/apache/satisfy/Satisfy-Regular.ttf"
# 手写风格字体: DancingScript
RUN wget -O /usr/share/fonts/truetype/custom/dancingscript.ttf "https://github.com/google/fonts/raw/main/ofl/dancingscript/DancingScript%5Bwght%5D.ttf"
# 手写风格字体: Caveat
RUN wget -O /usr/share/fonts/truetype/custom/caveat.ttf "https://github.com/google/fonts/raw/main/ofl/caveat/Caveat%5Bwght%5D.ttf"
# 艺术风格字体: LobsterTwo
RUN wget -O /usr/share/fonts/truetype/custom/lobstertwo.ttf "https://github.com/google/fonts/raw/main/ofl/lobstertwo/LobsterTwo-Regular.ttf"

# 设置字体权限
RUN chmod 644 /usr/share/fonts/truetype/custom/*

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