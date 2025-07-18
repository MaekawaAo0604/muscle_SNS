'use client'

import React, { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Upload, Camera, X, User } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ImageUploadProps {
  currentImage?: string;
  onImageUpload: (imageUrl: string) => void;
  onImageRemove?: () => void;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  shape?: 'circle' | 'square';
  uploadEndpoint?: string;
}

export default function ImageUpload({
  currentImage,
  onImageUpload,
  onImageRemove,
  label = "画像をアップロード",
  size = 'md',
  shape = 'circle',
  uploadEndpoint = '/api/user/profile/image'
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImage || null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  };

  const handleFileSelect = (file: File) => {
    if (!file) return;

    // ファイルタイプチェック
    if (!file.type.startsWith('image/')) {
      toast.error('画像ファイルを選択してください');
      return;
    }

    // ファイルサイズチェック（10MB）
    if (file.size > 10 * 1024 * 1024) {
      toast.error('ファイルサイズは10MB以下にしてください');
      return;
    }

    // プレビュー表示
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // アップロード実行
    uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(uploadEndpoint, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        onImageUpload(data.imageUrl);
        toast.success('画像をアップロードしました');
      } else {
        throw new Error('アップロードに失敗しました');
      }
    } catch (error) {
      console.error('アップロードエラー:', error);
      toast.error('画像のアップロードに失敗しました');
      setPreviewUrl(currentImage || null);
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragActive(false);
    
    const file = event.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    onImageRemove?.();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <Label>{label}</Label>
      
      <div className="flex items-center gap-4">
        {/* 現在の画像表示 */}
        <div className="relative">
          <Avatar className={`${sizeClasses[size]} ${shape === 'square' ? 'rounded-lg' : ''}`}>
            <AvatarImage src={previewUrl || ''} alt="プロフィール画像" />
            <AvatarFallback className="bg-gray-100">
              <User className="w-8 h-8 text-gray-400" />
            </AvatarFallback>
          </Avatar>
          
          {previewUrl && (
            <button
              onClick={handleRemoveImage}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
              disabled={uploading}
            >
              <X className="w-3 h-3" />
            </button>
          )}
          
          {uploading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
            </div>
          )}
        </div>

        {/* アップロードエリア */}
        <div className="flex-1">
          <Card
            className={`border-2 border-dashed transition-colors cursor-pointer ${
              dragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={triggerFileInput}
          >
            <CardContent className="p-6 text-center">
              <div className="space-y-2">
                <Upload className="w-8 h-8 mx-auto text-gray-400" />
                <div className="text-sm text-gray-600">
                  <span className="font-medium text-primary">クリックしてファイルを選択</span>
                  <br />
                  またはここにドラッグ&ドロップ
                </div>
                <p className="text-xs text-gray-500">
                  PNG, JPG, GIF (最大10MB)
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ファイル選択ボタン */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={triggerFileInput}
          disabled={uploading}
        >
          <Camera className="w-4 h-4 mr-2" />
          {uploading ? 'アップロード中...' : '画像を選択'}
        </Button>
        
        {previewUrl && (
          <Button
            variant="outline"
            onClick={handleRemoveImage}
            disabled={uploading}
          >
            <X className="w-4 h-4 mr-2" />
            削除
          </Button>
        )}
      </div>

      {/* 隠しファイル入力 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={uploading}
      />
    </div>
  );
}