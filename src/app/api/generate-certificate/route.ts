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

/**
 * 生成华丽的SVG路径，不依赖于系统字体
 * 这个函数使用预定义的字符路径和算法来生成华丽的文本路径
 */
function generateFancyTextPath(text: string, x: number, y: number, fontSize: number): string {
  // 字符宽度比例（通常一个字符的宽度约为其高度的0.6倍）
  const charWidthRatio = 0.6;
  // 字符间距比例
  const spacingRatio = 0.1;
  
  // 计算每个字符的宽度和总宽度
  const charWidth = fontSize * charWidthRatio;
  const spacing = fontSize * spacingRatio;
  const totalWidth = text.length * charWidth + (text.length - 1) * spacing;
  
  // 计算起始X坐标，使文本居中
  let startX = x - totalWidth / 2;
  
  // 生成的SVG路径集合
  let paths = [];
  
  // 为每个字符生成对应的华丽路径
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const charX = startX + i * (charWidth + spacing);
    
    // 添加字符的SVG路径（这里使用预设的路径或简单字符）
    const pathData = getCharacterPath(char, charX, y, fontSize);
    paths.push(pathData);
  }
  
  // 组合所有路径，应用金色渐变填充
  return `<path d="${paths.join(' ')}" fill="url(#gold-gradient)" stroke="#8B4513" stroke-width="${fontSize/100}"/>`;
}

/**
 * 为单个字符获取SVG路径数据
 * 这里使用简化的路径，在实际应用中可以使用更复杂的预定义路径
 */
function getCharacterPath(char: string, x: number, y: number, fontSize: number): string {
  // 字符宽度和高度
  const width = fontSize * 0.6;
  const height = fontSize;
  
  // 根据字符返回对应的SVG路径
  // 这是简化版，实际应用中可以使用更精细的预定义路径
  const charPaths: {[key: string]: string} = {
    'A': `M${x},${y} L${x + width/2},${y - height} L${x + width},${y} L${x + width*0.75},${y - height/2} L${x + width*0.25},${y - height/2} Z`, 
    'B': `M${x},${y - height} L${x},${y} L${x + width*0.8},${y} C${x + width*1.2},${y},${x + width*1.2},${y - height/2},${x + width*0.8},${y - height/2} L${x},${y - height/2} M${x},${y - height/2} L${x + width*0.8},${y - height/2} C${x + width*1.2},${y - height/2},${x + width*1.2},${y - height},${x + width*0.8},${y - height} L${x},${y - height}`,
    'C': `M${x + width},${y - height*0.8} C${x + width*0.5},${y - height*1.1},${x},${y - height*0.6},${x},${y - height/2} C${x},${y - height*0.4},${x + width*0.5},${y + 0.1*height},${x + width},${y - height*0.2}`,
  };
  
  // 如果字符没有预定义路径，使用通用装饰性曲线
  if (!charPaths[char]) {
    // 创建一个基本的花哨字符形状（斜体效果的曲线）
    return `M${x},${y} Q${x + width*0.5},${y - height*1.1},${x + width},${y - height*0.9} T${x + width*1.5},${y}`;
  }
  
  return charPaths[char];
} 