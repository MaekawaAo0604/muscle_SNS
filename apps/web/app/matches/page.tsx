'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'react-hot-toast'
import { MessageCircle, User, Calendar, ArrowLeft } from 'lucide-react'
import { apiGet } from '@/lib/api'

interface MatchUser {
  id: string
  nickname: string
  age?: number
  gender?: string
  bio?: string
  profileImageUrl?: string
  trainingProfile?: {
    experienceYears?: number
    frequencyPerWeek?: number
    favoriteBodyParts?: string
    trainingGoals?: string
  }
}

interface Match {
  id: string
  createdAt: string
  isActive: boolean
  user: MatchUser
  lastMessage?: {
    content: string
    createdAt: string
    fromUserId: string
  }
  unreadCount: number
}

export default function MatchesPage() {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const [matches, setMatches] = useState<Match[]>([])
  const [isLoadingMatches, setIsLoadingMatches] = useState(false)

  // Temporary: Comment out auth check for testing
  // useEffect(() => {
  //   if (!isLoading && !isAuthenticated) {
  //     router.push('/login')
  //   }
  // }, [isLoading, isAuthenticated, router])

  useEffect(() => {
    // テスト用：初期化時にマッチを取得
    console.log('localStorage authToken:', localStorage.getItem('authToken'))
    console.log('user:', user)
    fetchMatches()
  }, [])

  const fetchMatches = async () => {
    // テスト用：常にdemo-user-1を使用
    const testUser = { id: 'demo-user-1', email: 'hiroshi@example.com' }
    
    setIsLoadingMatches(true)
    try {
      console.log('Fetching matches for user:', testUser.id)
      const data = await apiGet(`/matching/matches?userId=${testUser.id}`)
      console.log('API response:', data)
      setMatches(data.matches || [])
    } catch (error) {
      console.error('Match fetch error:', error)
      toast.error('マッチ一覧の取得に失敗しました')
    } finally {
      setIsLoadingMatches(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      return '今日'
    } else if (diffDays === 1) {
      return '昨日'
    } else if (diffDays < 7) {
      return `${diffDays}日前`
    } else {
      return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
    }
  }

  const getExperienceText = (years?: number) => {
    if (!years) return '未設定'
    if (years < 1) return '初心者'
    if (years < 3) return '中級者'
    return '上級者'
  }

  // Temporary: Skip auth loading for testing
  // if (isLoading) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center">
  //       <div className="text-center">
  //         <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
  //         <p className="mt-4 text-gray-600">読み込み中...</p>
  //       </div>
  //     </div>
  //   )
  // }

  // Temporary: Allow testing without authentication
  // if (!isAuthenticated || !user) {
  //   return null
  // }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* ヘッダー */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push('/dashboard')}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">マッチ一覧</h1>
              <p className="text-gray-600">トレーニング仲間とつながろう</p>
            </div>
          </div>

          {isLoadingMatches ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
            </div>
          ) : matches.length > 0 ? (
            <div className="space-y-4">
              {matches.map((match) => (
                <Card 
                  key={match.id} 
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => router.push(`/messages/${match.id}`)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-16 h-16">
                        <AvatarImage 
                          src={match.user.profileImageUrl} 
                          alt={match.user.nickname}
                        />
                        <AvatarFallback>
                          <User className="w-8 h-8" />
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold truncate">
                            {match.user.nickname}
                          </h3>
                          {match.user.age && (
                            <Badge variant="secondary" className="text-xs">
                              {match.user.age}歳
                            </Badge>
                          )}
                          {match.user.trainingProfile?.experienceYears && (
                            <Badge variant="outline" className="text-xs">
                              {getExperienceText(match.user.trainingProfile.experienceYears)}
                            </Badge>
                          )}
                        </div>
                        
                        {match.lastMessage ? (
                          <p className="text-gray-600 text-sm truncate">
                            {match.lastMessage.fromUserId === 'demo-user-1' ? 'あなた: ' : ''}
                            {match.lastMessage.content}
                          </p>
                        ) : (
                          <p className="text-gray-400 text-sm">
                            メッセージを送ってみましょう！
                          </p>
                        )}
                        
                        <div className="flex items-center gap-4 mt-2">
                          {match.user.trainingProfile?.favoriteBodyParts && (
                            <span className="text-xs text-gray-500">
                              好きな部位: {match.user.trainingProfile.favoriteBodyParts}
                            </span>
                          )}
                          {match.user.trainingProfile?.frequencyPerWeek && (
                            <span className="text-xs text-gray-500">
                              週{match.user.trainingProfile.frequencyPerWeek}回
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-1 text-gray-400">
                          <Calendar className="w-3 h-3" />
                          <span className="text-xs">
                            {formatDate(match.createdAt)}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <MessageCircle className="w-4 h-4 text-primary" />
                          {match.unreadCount > 0 && (
                            <Badge className="bg-red-500 text-white text-xs min-w-[1.5rem] h-6">
                              {match.unreadCount > 99 ? '99+' : match.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <div className="text-6xl mb-4">💬</div>
                <h3 className="text-xl font-semibold mb-2">まだマッチがありません</h3>
                <p className="text-gray-600 mb-6">
                  マッチングで新しいトレーニング仲間を見つけましょう！
                </p>
                <div className="space-y-2">
                  <Button 
                    onClick={() => router.push('/matching')}
                    className="w-full sm:w-auto"
                  >
                    マッチングを始める
                  </Button>
                  <br />
                  <Button 
                    variant="outline"
                    onClick={() => router.push('/dashboard')}
                    className="w-full sm:w-auto"
                  >
                    ダッシュボードに戻る
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}