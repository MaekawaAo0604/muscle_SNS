'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'react-hot-toast'

export default function DashboardPage() {
  const { user, isLoading, isAuthenticated, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isLoading, isAuthenticated, router])

  const handleLogout = async () => {
    try {
      await logout()
      toast.success('ログアウトしました')
      router.push('/')
    } catch (error) {
      toast.error('ログアウトに失敗しました')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-2xl">ダッシュボード</CardTitle>
              <CardDescription>
                おかえりなさい、{user.nickname}さん！
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {user.photoURL && (
                    <img 
                      src={user.photoURL} 
                      alt={user.nickname}
                      className="w-12 h-12 rounded-full"
                    />
                  )}
                  <div>
                    <h3 className="font-semibold">{user.nickname}</h3>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                </div>
                <Button onClick={handleLogout} variant="outline">
                  ログアウト
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>🔥 マッチ一覧</CardTitle>
                <CardDescription>
                  マッチしたトレーニング仲間とチャットしよう
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full"
                  onClick={() => router.push('/matches')}
                >
                  マッチ一覧を見る
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>💪 マッチング</CardTitle>
                <CardDescription>
                  新しいトレーニング仲間を見つけましょう
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push('/matching')}
                >
                  マッチングを開始
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>⚙️ プロフィール</CardTitle>
                <CardDescription>
                  プロフィールを編集して、より良いマッチングを
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => router.push('/profile')}
                >
                  プロフィール編集
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>💬 最近のチャット</CardTitle>
                <CardDescription>
                  最新のメッセージをチェックしよう
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push('/matches')}
                >
                  チャット一覧
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}