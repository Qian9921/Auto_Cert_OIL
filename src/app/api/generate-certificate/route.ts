import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import sharp from 'sharp';

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

    // 读取PNG模板
    const templatePath = path.join(process.cwd(), 'public', '1.png');
    
    // 准备SVG文本覆盖层 - 使用多个备选装饰性字体
    const svgText = `
      <svg width="1800" height="1300">
        <!-- 定义样式效果 -->
        <defs>
          <linearGradient id="gold-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#B8860B;stop-opacity:1" />
            <stop offset="50%" style="stop-color:#DAA520;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#B8860B;stop-opacity:1" />
          </linearGradient>
        </defs>

        <!-- 学生姓名 - 使用华丽字体，多个备选 -->
        <text 
          x="1004" 
          y="660" 
          font-family="'Pacifico', 'Lobster Two', 'Caveat', 'Dancing Script', 'Satisfy', 'Brush Script MT', cursive" 
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
          font-family="'Dancing Script', 'Caveat', 'Satisfy', 'Noto Sans', sans-serif" 
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
          font-family="'Liberation Sans', 'Noto Sans', 'Open Sans', 'DejaVu Sans', sans-serif" 
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
          font-family="'Satisfy', 'Pacifico', 'Caveat', 'Dancing Script', cursive" 
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
          font-family="'Liberation Sans', 'Noto Sans', 'Open Sans', 'DejaVu Sans', sans-serif" 
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
          font-family="'Liberation Sans', 'Noto Sans', 'Open Sans', 'DejaVu Sans', sans-serif" 
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
      { error: '生成证书时出错' },
      { status: 500 }
    );
  }
} 