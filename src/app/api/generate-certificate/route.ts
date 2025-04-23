import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import sharp from 'sharp';
import fs from 'fs/promises';

// 配置sharp以减少内存使用和避免并发问题
sharp.concurrency(1);  // 限制为单线程处理
sharp.cache(false);    // 禁用缓存以减少内存使用

// 预加载字体文件（只在服务启动时加载一次）
const fontCache = {
  pacifico: null as string | null,
  dancingScript: null as string | null,
  sacramento: null as string | null
};

// 字体加载函数
async function loadFonts() {
  try {
    const fontPaths = {
      pacifico: path.join(process.cwd(), 'public', 'fonts', 'Pacifico.ttf'),
      dancingScript: path.join(process.cwd(), 'public', 'fonts', 'DancingScript.ttf'),
      sacramento: path.join(process.cwd(), 'public', 'fonts', 'Sacramento.ttf')
    };

    // 异步读取字体文件
    const [pacificoBuffer, dancingScriptBuffer, sacramentoBuffer] = await Promise.all([
      fs.readFile(fontPaths.pacifico),
      fs.readFile(fontPaths.dancingScript),
      fs.readFile(fontPaths.sacramento)
    ]);

    // 转换为base64并缓存
    fontCache.pacifico = pacificoBuffer.toString('base64');
    fontCache.dancingScript = dancingScriptBuffer.toString('base64');
    fontCache.sacramento = sacramentoBuffer.toString('base64');
    
    console.log('字体文件加载成功');
  } catch (error) {
    console.error('加载字体文件失败:', error);
    // 失败时不阻止服务启动，但后续使用时需要检查
  }
}

// 立即加载字体
loadFonts();

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

    // 检查字体是否已加载，如果没有则使用系统字体回退
    if (!fontCache.pacifico || !fontCache.dancingScript || !fontCache.sacramento) {
      console.warn('字体未完全加载，使用系统字体回退');
    }

    // 使用缓存的字体或回退到空字符串
    const fonts = {
      pacifico: fontCache.pacifico || '',
      dancingScript: fontCache.dancingScript || '',
      sacramento: fontCache.sacramento || ''
    };

    // 读取PNG模板，使用异步API
    const templatePath = path.join(process.cwd(), 'public', '1.png');
    
    // 准备SVG文本覆盖层 - 使用内嵌字体
    const fontFaces = fonts.pacifico ? 
      `
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
      ` : '';

    // 根据是否有字体资源决定使用嵌入字体还是系统字体
    const studentNameFontFamily = fonts.pacifico ? 
      "'PacificoEmbedded', 'SacramentoEmbedded', cursive" : 
      "'Times New Roman', serif";
    
    const contentFontFamily = fonts.dancingScript ? 
      "'DancingScriptEmbedded', Arial, sans-serif" : 
      "Arial, sans-serif";
    
    const signatureFontFamily = fonts.sacramento ? 
      "'SacramentoEmbedded', 'PacificoEmbedded', cursive" : 
      "'Times New Roman', serif";

    const svgText = `
      <svg width="1800" height="1300" xmlns="http://www.w3.org/2000/svg">
        <!-- 内嵌字体定义 -->
        <defs>
          <style type="text/css">
            ${fontFaces}
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
          font-family="${studentNameFontFamily}" 
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
          font-family="${contentFontFamily}" 
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
          font-family="${signatureFontFamily}" 
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
      } catch (e) {
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