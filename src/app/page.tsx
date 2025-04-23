'use client';

import { useState } from 'react';

export default function Home() {
  const [formData, setFormData] = useState({
    studentName: '',
    ngoSignature: '',
    ngoName: '',
    contents: '',
    date: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/generate-certificate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        throw new Error('证书生成失败');
      }
      
      // 获取PNG数据并创建下载链接
      const pngBlob = await response.blob();
      const url = window.URL.createObjectURL(pngBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'certificate.png';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('提交表单出错:', error);
      alert('生成证书时出错');
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-8">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">图片证书生成</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1">学生姓名</label>
            <input
              type="text"
              name="studentName"
              value={formData.studentName}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>
          
          <div>
            <label className="block mb-1">NGO 签名</label>
            <input
              type="text"
              name="ngoSignature"
              value={formData.ngoSignature}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          
          <div>
            <label className="block mb-1">NGO 名称</label>
            <input
              type="text"
              name="ngoName"
              value={formData.ngoName}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>
          
          <div>
            <label className="block mb-1">内容</label>
            <textarea
              name="contents"
              value={formData.contents}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded"
              rows={4}
              required
            />
          </div>
          
          <div>
            <label className="block mb-1">日期</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded"
          >
            生成图片证书
          </button>
        </form>
      </div>
    </main>
  );
} 