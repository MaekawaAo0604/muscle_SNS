'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { toast } from 'react-hot-toast'
import { Send, ArrowLeft, User, Dumbbell } from 'lucide-react'
import { apiGet, apiPost, apiPatch } from '@/lib/api'

interface Message {
  id: string
  content: string
  fromUserId: string
  toUserId: string
  createdAt: string
  isRead: boolean
}

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

interface MatchInfo {
  id: string
  user: MatchUser
  createdAt: string
}

export default function MessagesPage({ params }: { params: { matchId: string } }) {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [matchInfo, setMatchInfo] = useState<MatchInfo | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Temporary: Comment out auth check for testing
  // useEffect(() => {
  //   if (!isLoading && !isAuthenticated) {
  //     router.push('/login')
  //   }
  // }, [isLoading, isAuthenticated, router])

  useEffect(() => {
    // テスト用：初期化時にマッチ情報とメッセージを取得
    if (params.matchId) {
      fetchMatchInfo()
      fetchMessages()
    }
  }, [params.matchId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchMatchInfo = async () => {
    // テスト用：常にdemo-user-1を使用
    const testUser = { id: 'demo-user-1', email: 'hiroshi@example.com' }
    
    try {
      const data = await apiGet(`/matching/matches/${params.matchId}?userId=${testUser.id}`)
      setMatchInfo(data)
    } catch (error) {
      toast.error('マッチ情報の取得に失敗しました')
      router.push('/matches')
    }
  }

  const fetchMessages = async () => {
    // テスト用：常にdemo-user-1を使用
    const testUser = { id: 'demo-user-1', email: 'hiroshi@example.com' }
    
    setIsLoadingMessages(true)
    try {
      const data = await apiGet(`/messages/${params.matchId}?userId=${testUser.id}`)
      setMessages(data.messages)
      
      // Mark messages as read
      await markMessagesAsRead()
    } catch (error) {
      toast.error('メッセージの取得に失敗しました')
    } finally {
      setIsLoadingMessages(false)
    }
  }

  const markMessagesAsRead = async () => {
    // テスト用：常にdemo-user-1を使用
    const testUser = { id: 'demo-user-1', email: 'hiroshi@example.com' }
    
    try {
      await apiPatch(`/messages/${params.matchId}/read?userId=${testUser.id}`, {})
    } catch (error) {
      console.error('Failed to mark messages as read:', error)
    }
  }

  const sendMessage = async () => {
    // テスト用：常にdemo-user-1を使用
    const testUser = { id: 'demo-user-1', email: 'hiroshi@example.com' }
    if (!newMessage.trim() || !matchInfo) return

    setIsSending(true)
    try {
      const data = await apiPost(`/messages/${params.matchId}?userId=${testUser.id}`, {
        content: newMessage.trim(),
      })
      
      setMessages(prev => [...prev, data.message])
      setNewMessage('')
    } catch (error) {
      toast.error('メッセージの送信に失敗しました')
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('ja-JP', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    })
  }

  const getExperienceText = (years?: number) => {
    if (!years) return '未設定'
    if (years < 1) return '初心者'
    if (years < 3) return '中級者'
    return '上級者'
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

  // Temporary: Allow testing without authentication
  // if (!isAuthenticated || !user) {
  //   return null
  // }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="container mx-auto px-4 py-4">
        <div className="max-w-4xl mx-auto h-[calc(100vh-2rem)] flex flex-col">
          {/* ヘッダー */}
          {matchInfo && (
            <Card className="mb-4">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => router.push('/matches')}
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  
                  <Avatar className="w-12 h-12">
                    <AvatarImage 
                      src={matchInfo.user.profileImageUrl} 
                      alt={matchInfo.user.nickname}
                    />
                    <AvatarFallback>
                      <User className="w-6 h-6" />
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{matchInfo.user.nickname}</CardTitle>
                      {matchInfo.user.age && (
                        <Badge variant="secondary" className="text-xs">
                          {matchInfo.user.age}歳
                        </Badge>
                      )}
                      {matchInfo.user.trainingProfile?.experienceYears && (
                        <Badge variant="outline" className="text-xs">
                          <Dumbbell className="w-3 h-3 mr-1" />
                          {getExperienceText(matchInfo.user.trainingProfile.experienceYears)}
                        </Badge>
                      )}
                    </div>
                    {matchInfo.user.trainingProfile?.frequencyPerWeek && (
                      <p className="text-sm text-gray-600">
                        週{matchInfo.user.trainingProfile.frequencyPerWeek}回トレーニング
                      </p>
                    )}
                  </div>
                </div>
              </CardHeader>
            </Card>
          )}

          {/* メッセージエリア */}
          <Card className="flex-1 flex flex-col">
            <CardContent className="flex-1 flex flex-col p-0">
              {/* メッセージリスト */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {isLoadingMessages ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : messages.length > 0 ? (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.fromUserId === 'demo-user-1' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.fromUserId === 'demo-user-1'
                            ? 'bg-primary text-white'
                            : 'bg-gray-200 text-gray-900'
                        }`}
                      >
                        <p className="break-words">{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          message.fromUserId === 'demo-user-1' ? 'text-primary-100' : 'text-gray-500'
                        }`}>
                          {formatTime(message.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>まだメッセージがありません</p>
                    <p className="text-sm">最初のメッセージを送ってみましょう！</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* メッセージ入力 */}
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="メッセージを入力..."
                    disabled={isSending}
                    className="flex-1"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || isSending}
                    size="icon"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}