import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import sharp from 'sharp';
import fs from 'fs';

export async function POST(req: NextRequest) {
  try {
    // 解析请求数据
    const data = await req.json();
    const { studentName, ngoSignature, ngoName, contents, date } = data;

    if (!studentName || !ngoName || !contents || !date) {
      return NextResponse.json(
        { error: '缺少必要的字段' },
        { status: 400 }
      );
    }

    // 读取字体文件并编码为base64
    const fontPaths = {
      pacifico: path.join(process.cwd(), 'public', 'fonts', 'Pacifico.ttf'),
      dancingScript: path.join(process.cwd(), 'public', 'fonts', 'DancingScript.ttf'),
      sacramento: path.join(process.cwd(), 'public', 'fonts', 'Sacramento.ttf')
    };

    // 读取字体文件
    const fonts = {
      pacifico: fs.readFileSync(fontPaths.pacifico).toString('base64'),
      dancingScript: fs.readFileSync(fontPaths.dancingScript).toString('base64'),
      sacramento: fs.readFileSync(fontPaths.sacramento).toString('base64')
    };

    // 读取PNG模板
    const templatePath = path.join(process.cwd(), 'public', '1.png');
    
    // 准备SVG文本覆盖层 - 使用内嵌字体
    const svgText = `
      <svg width="1800" height="1300" xmlns="http://www.w3.org/2000/svg">
        <!-- 内嵌字体定义 -->
        <defs>
          <style type="text/css">
            @font-face {
              font-family: 'PacificoEmbedded';
              src: url(data:font/truetype;base64,${fonts.pacifico}) format('truetype');
              font-weight: normal;
              font-style: normal;
            }
            @font-face {
              font-family: 'DancingScriptEmbedded';
              src: url(data:font/truetype;base64,${fonts.dancingScript}) format('truetype');
              font-weight: normal;
              font-style: normal;
            }
            @font-face {
              font-family: 'SacramentoEmbedded';
              src: url(data:font/truetype;base64,${fonts.sacramento}) format('truetype');
              font-weight: normal;
              font-style: normal;
            }
          </style>
          
          <linearGradient id="gold-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#B8860B;stop-opacity:1" />
            <stop offset="50%" style="stop-color:#DAA520;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#B8860B;stop-opacity:1" />
          </linearGradient>
        </defs>

        <!-- 学生姓名 - 使用内嵌字体（替代Playwrite RO） -->
        <text 
          x="1004" 
          y="660" 
          font-family="'PacificoEmbedded', 'SacramentoEmbedded', cursive" 
          font-size="100" 
          font-weight="bold" 
          text-anchor="middle"
          fill="url(#gold-gradient)"
          stroke="#8B4513"
          stroke-width="1"
        >
          ${studentName}
        </text>

        <!-- 学生姓名 - 文中使用 -->
        <text 
          x="1106" 
          y="810" 
          font-family="'DancingScriptEmbedded', Arial, sans-serif" 
          font-size="40"  
          text-anchor="middle" 
          fill="#8B4513"
        >
          ${studentName}
        </text>
        
        <!-- NGO名称 -->
        <text 
          x="1337" 
          y="1250" 
          font-family="Arial, Helvetica, sans-serif" 
          font-size="70" 
          text-anchor="middle" 
          fill="rgb(0, 0, 0)"
        >
          ${ngoName}
        </text>
        
        <!-- NGO签名 -->
        <text 
          x="689" 
          y="1200" 
          font-family="'SacramentoEmbedded', 'PacificoEmbedded', cursive" 
          font-size="60" 
          text-anchor="middle" 
          fill="rgb(0, 0, 0)"
        >
          ${ngoSignature || ''}
        </text>
        
        <!-- 内容 -->
        <text 
          x="979" 
          y="915" 
          font-family="Arial, Helvetica, sans-serif" 
          font-size="40" 
          text-anchor="middle" 
          fill="rgb(0, 0, 0)"
        >
          ${contents}
        </text>
        
        <!-- 日期 -->
        <text 
          x="1337" 
          y="1190" 
          font-family="Arial, Helvetica, sans-serif" 
          font-size="60" 
          text-anchor="middle" 
          fill="rgb(0, 0, 0)"
        >
          ${date}
        </text>
      </svg>
    `;

    // 使用sharp处理图像
    const compositeImage = await sharp(templatePath)
      .composite([
        {
          input: Buffer.from(svgText),
          top: 0,
          left: 0,
        },
      ])
      .png()
      .toBuffer();
    
    // 设置响应头，使浏览器下载文件
    return new NextResponse(compositeImage, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': 'attachment; filename="certificate.png"',
      },
    });
  } catch (error) {
    console.error('生成证书时出错:', error);
    return NextResponse.json(
      { error: '生成证书时出错', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 