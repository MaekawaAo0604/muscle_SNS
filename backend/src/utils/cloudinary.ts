import { v2 as cloudinary } from 'cloudinary';
import { Request } from 'express';
import multer from 'multer';
import { Readable } from 'stream';

// Cloudinary設定
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// メモリーストレージ設定
const storage = multer.memoryStorage();

// Multerアップロード設定
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('画像ファイルのみアップロード可能です'));
    }
  },
});

// Cloudinaryアップロード
export const uploadToCloudinary = (buffer: Buffer, folder: string = 'muscle-matching'): Promise<any> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: 'image',
        transformation: [
          {
            width: 800,
            height: 800,
            crop: 'limit',
            quality: 'auto:good',
            format: 'webp'
          }
        ]
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(stream);
  });
};

// 画像削除
export const deleteImage = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('画像削除エラー:', error);
  }
};

// 画像URL生成
export const generateImageUrl = (publicId: string, transformation?: any): string => {
  return cloudinary.url(publicId, {
    secure: true,
    transformation: transformation || {
      width: 400,
      height: 400,
      crop: 'fill',
      quality: 'auto:good',
      format: 'webp'
    }
  });
};

export default cloudinary;