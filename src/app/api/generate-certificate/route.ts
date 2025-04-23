import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import sharp from 'sharp';

// 配置sharp以减少内存使用和避免并发问题
sharp.concurrency(1);  // 限制为单线程处理
sharp.cache(false);    // 禁用缓存以减少内存使用

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

    // 读取PNG模板，使用异步API
    const templatePath = path.join(process.cwd(), 'public', '1.png');
    
    // 准备SVG文本覆盖层 - 仅使用系统安全字体，不使用自定义字体
    const svgText = `
      <svg width="1800" height="1300" xmlns="http://www.w3.org/2000/svg">
        <!-- 只使用渐变定义，不使用自定义字体 -->
        <defs>
          <linearGradient id="gold-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#B8860B;stop-opacity:1" />
            <stop offset="50%" style="stop-color:#DAA520;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#B8860B;stop-opacity:1" />
          </linearGradient>
        </defs>

        <!-- 学生姓名 - 使用系统安全字体 -->
        <text 
          x="1004" 
          y="660" 
          font-family="serif" 
          font-size="100" 
          font-weight="bold" 
          font-style="italic"
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
          font-family="sans-serif" 
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
          font-family="sans-serif" 
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
          font-family="serif" 
          font-size="60"
          font-style="italic" 
          text-anchor="middle" 
          fill="rgb(0, 0, 0)"
        >
          ${ngoSignature || ''}
        </text>
        
        <!-- 内容 -->
        <text 
          x="979" 
          y="915" 
          font-family="sans-serif" 
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
          font-family="sans-serif" 
          font-size="60" 
          text-anchor="middle" 
          fill="rgb(0, 0, 0)"
        >
          ${date}
        </text>
      </svg>
    `;

    // 使用sharp处理图像，设置低级别选项以避免fontconfig问题
    const compositeImage = await sharp(templatePath, {
      // 设置更低的内存限制
      limitInputPixels: 30000 * 30000, // 约900MP
    })
      .composite([
        {
          input: Buffer.from(svgText),
          top: 0,
          left: 0,
        },
      ])
      .png({ compressionLevel: 6 }) // 中等压缩，在质量和大小之间平衡
      .toBuffer();
    
    // 建议手动触发垃圾回收
    if (global.gc) {
      try {
        global.gc();
      } catch {
        // 忽略，如果gc不可用
      }
    }
    
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