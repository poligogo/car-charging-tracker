/**
 * 調整圖片大小並返回 base64 格式的圖片數據
 * @param file 要處理的圖片文件
 * @returns Promise<string> 返回處理後的圖片 base64 字串
 */
export const resizeImage = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        // 計算縮放比例
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d', {
          alpha: true,
          willReadFrequently: true
        });
        
        if (ctx) {
          // 確保畫布是完全透明的
          ctx.clearRect(0, 0, width, height);
          
          // 設置合成模式以保持透明度
          ctx.globalCompositeOperation = 'source-over';
          
          // 繪製圖片
          ctx.drawImage(img, 0, 0, width, height);

          // 檢查是否為 PNG 並保持透明度
          if (file.type === 'image/png') {
            // 使用 PNG 格式並保持完全品質
            const dataUrl = canvas.toDataURL('image/png', 1.0);
            resolve(dataUrl);
          } else {
            // 對於非 PNG 圖片，轉換為 JPEG
            const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
            resolve(dataUrl);
          }
        }
      };
      
      // 設置圖片的跨域屬性
      img.crossOrigin = 'anonymous';
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};
