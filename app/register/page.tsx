'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'react-hot-toast'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nickname: '',
    age: '',
    gender: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { register, loginWithGoogle } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await register({
        email: formData.email,
        password: formData.password,
        nickname: formData.nickname,
        age: formData.age ? parseInt(formData.age) : undefined,
        gender: formData.gender,
      })
      toast.success('アカウントを作成しました')
      router.push('/dashboard')
    } catch (error) {
      toast.error('アカウントの作成に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    try {
      await loginWithGoogle()
      toast.success('Googleでログインしました')
      router.push('/dashboard')
    } catch (error) {
      toast.error('Googleログインに失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">アカウント作成</CardTitle>
          <CardDescription className="text-center">
            新しいアカウントを作成してください
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <Input
                id="password"
                type="password"
                placeholder="8文字以上で入力"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                required
                minLength={8}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nickname">ニックネーム</Label>
              <Input
                id="nickname"
                type="text"
                placeholder="表示名を入力"
                value={formData.nickname}
                onChange={(e) => handleChange('nickname', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="age">年齢</Label>
              <Input
                id="age"
                type="number"
                placeholder="年齢を入力"
                value={formData.age}
                onChange={(e) => handleChange('age', e.target.value)}
                min="18"
                max="100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">性別</Label>
              <Select onValueChange={(value) => handleChange('gender', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="性別を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">男性</SelectItem>
                  <SelectItem value="FEMALE">女性</SelectItem>
                  <SelectItem value="OTHER">その他</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'アカウント作成中...' : 'アカウント作成'}
            </Button>
          </form>
          
          <div className="mt-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  または
                </span>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full mt-4"
              onClick={handleGoogleLogin}
              disabled={isLoading}
            >
              Googleでアカウント作成
            </Button>
          </div>
          
          <div className="mt-4 text-center text-sm">
            既にアカウントをお持ちの方は{' '}
            <Link href="/login" className="text-primary hover:underline">
              こちら
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}