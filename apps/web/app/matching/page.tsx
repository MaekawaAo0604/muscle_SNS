'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'react-hot-toast'
import { Heart, X, MapPin, Dumbbell, Timer, User } from 'lucide-react'
import MatchingFilters from '@/components/matching-filters'

interface UserProfile {
  id: string
  nickname: string
  age?: number
  gender?: string
  bio?: string
  profileImageUrl?: string
  trainingProfile?: {
    experienceYears?: number
    frequencyPerWeek?: number
    benchPressWeight?: number
    squatWeight?: number
    deadliftWeight?: number
    favoriteBodyParts?: string
    trainingGoals?: string
  }
}

export default function MatchingPage() {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
  const [userQueue, setUserQueue] = useState<UserProfile[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null)
  const [filters, setFilters] = useState({
    ageMin: 18,
    ageMax: 65,
    gender: undefined,
    gymIds: undefined,
    trainingLevel: undefined,
    timeSlots: undefined
  })

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isLoading, isAuthenticated, router])

  useEffect(() => {
    if (user) {
      fetchPotentialMatches()
    }
  }, [user])

  const fetchPotentialMatches = async () => {
    if (!user) return
    
    setIsLoadingUsers(true)
    try {
      const params = new URLSearchParams()
      
      if (filters.ageMin !== 18) params.append('ageMin', filters.ageMin.toString())
      if (filters.ageMax !== 65) params.append('ageMax', filters.ageMax.toString())
      if (filters.gender) params.append('gender', filters.gender)
      if (filters.gymIds) {
        filters.gymIds.forEach(gymId => params.append('gymIds', gymId))
      }
      if (filters.trainingLevel) params.append('trainingLevel', filters.trainingLevel)
      if (filters.timeSlots) {
        filters.timeSlots.forEach(timeSlot => params.append('timeSlots', timeSlot))
      }
      
      const response = await fetch(`/api/matching/potential?${params}`)
      if (response.ok) {
        const data = await response.json()
        setUserQueue(data.candidates)
        setCurrentUser(data.candidates[0] || null)
      }
    } catch (error) {
      toast.error('ユーザーの読み込みに失敗しました')
    } finally {
      setIsLoadingUsers(false)
    }
  }

  const handleSwipe = async (direction: 'left' | 'right') => {
    if (!currentUser || !user) return

    setSwipeDirection(direction)
    
    try {
      const response = await fetch('/api/matching/swipe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          toUserId: currentUser.id,
          direction: direction,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.isMatch) {
          toast.success('🎉 マッチしました！')
        } else if (direction === 'right') {
          toast.success('👍 いいねを送りました')
        }
        
        // 次のユーザーを表示
        setTimeout(() => {
          const nextQueue = userQueue.slice(1)
          setUserQueue(nextQueue)
          setCurrentUser(nextQueue[0] || null)
          setSwipeDirection(null)
          
          // キューが少なくなったら新しいユーザーを読み込み
          if (nextQueue.length < 3) {
            fetchPotentialMatches()
          }
        }, 300)
      }
    } catch (error) {
      toast.error('操作に失敗しました')
      setSwipeDirection(null)
    }
  }

  const handleApplyFilters = () => {
    fetchPotentialMatches()
  }

  const handleClearFilters = () => {
    setFilters({
      ageMin: 18,
      ageMax: 65,
      gender: undefined,
      gymIds: undefined,
      trainingLevel: undefined,
      timeSlots: undefined
    })
    setTimeout(() => {
      fetchPotentialMatches()
    }, 100)
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

  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">マッチング</h1>
            <p className="text-gray-600">トレーニング仲間を見つけよう</p>
          </div>

          {/* フィルタリング機能 */}
          <div className="mb-6">
            <MatchingFilters
              filters={filters}
              onFiltersChange={setFilters}
              onApplyFilters={handleApplyFilters}
              onClearFilters={handleClearFilters}
            />
          </div>

          {isLoadingUsers ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
            </div>
          ) : currentUser ? (
            <div className="relative">
              <Card className={`transition-all duration-300 ${
                swipeDirection === 'left' ? 'transform -translate-x-full rotate-12 opacity-0' :
                swipeDirection === 'right' ? 'transform translate-x-full rotate-12 opacity-0' :
                'transform translate-x-0 rotate-0 opacity-100'
              }`}>
                <CardHeader className="text-center">
                  <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center">
                    {currentUser.profileImageUrl ? (
                      <img 
                        src={currentUser.profileImageUrl} 
                        alt={currentUser.nickname}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-12 h-12 text-primary-600" />
                    )}
                  </div>
                  <CardTitle className="text-2xl">{currentUser.nickname}</CardTitle>
                  <CardDescription>
                    {currentUser.age && `${currentUser.age}歳`}
                    {currentUser.gender && ` • ${currentUser.gender}`}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {currentUser.bio && (
                    <div>
                      <p className="text-gray-700 text-center">{currentUser.bio}</p>
                    </div>
                  )}

                  {currentUser.trainingProfile && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Dumbbell className="w-4 h-4 text-primary" />
                        <span className="text-sm text-gray-600">トレーニング経験</span>
                        <Badge variant="secondary">
                          {getExperienceText(currentUser.trainingProfile.experienceYears)}
                        </Badge>
                      </div>

                      {currentUser.trainingProfile.frequencyPerWeek && (
                        <div className="flex items-center gap-2">
                          <Timer className="w-4 h-4 text-primary" />
                          <span className="text-sm text-gray-600">週</span>
                          <Badge variant="secondary">
                            {currentUser.trainingProfile.frequencyPerWeek}回
                          </Badge>
                        </div>
                      )}

                      {(currentUser.trainingProfile.benchPressWeight || 
                        currentUser.trainingProfile.squatWeight || 
                        currentUser.trainingProfile.deadliftWeight) && (
                        <div className="grid grid-cols-3 gap-2 text-center">
                          {currentUser.trainingProfile.benchPressWeight && (
                            <div className="bg-gray-50 p-2 rounded">
                              <div className="text-xs text-gray-500">ベンチ</div>
                              <div className="font-semibold">{currentUser.trainingProfile.benchPressWeight}kg</div>
                            </div>
                          )}
                          {currentUser.trainingProfile.squatWeight && (
                            <div className="bg-gray-50 p-2 rounded">
                              <div className="text-xs text-gray-500">スクワット</div>
                              <div className="font-semibold">{currentUser.trainingProfile.squatWeight}kg</div>
                            </div>
                          )}
                          {currentUser.trainingProfile.deadliftWeight && (
                            <div className="bg-gray-50 p-2 rounded">
                              <div className="text-xs text-gray-500">デッド</div>
                              <div className="font-semibold">{currentUser.trainingProfile.deadliftWeight}kg</div>
                            </div>
                          )}
                        </div>
                      )}

                      {currentUser.trainingProfile.favoriteBodyParts && (
                        <div>
                          <div className="text-sm text-gray-600 mb-1">好きな部位</div>
                          <Badge variant="outline">{currentUser.trainingProfile.favoriteBodyParts}</Badge>
                        </div>
                      )}

                      {currentUser.trainingProfile.trainingGoals && (
                        <div>
                          <div className="text-sm text-gray-600 mb-1">目標</div>
                          <Badge variant="outline">{currentUser.trainingProfile.trainingGoals}</Badge>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* スワイプボタン */}
              <div className="flex justify-center gap-8 mt-8">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-16 h-16 rounded-full border-2 border-gray-300 hover:border-red-300 hover:bg-red-50"
                  onClick={() => handleSwipe('left')}
                  disabled={!!swipeDirection}
                >
                  <X className="w-6 h-6 text-red-500" />
                </Button>
                
                <Button
                  size="lg"
                  className="w-16 h-16 rounded-full bg-primary hover:bg-primary/90"
                  onClick={() => handleSwipe('right')}
                  disabled={!!swipeDirection}
                >
                  <Heart className="w-6 h-6 text-white" />
                </Button>
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <div className="text-6xl mb-4">🎯</div>
                <h3 className="text-xl font-semibold mb-2">お疲れ様でした！</h3>
                <p className="text-gray-600 mb-6">
                  今のところマッチング可能なユーザーはいません。
                  <br />
                  後でもう一度確認してみてください。
                </p>
                <div className="space-y-2">
                  <Button 
                    onClick={() => router.push('/dashboard')}
                    className="w-full"
                  >
                    ダッシュボードに戻る
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={fetchPotentialMatches}
                    className="w-full"
                  >
                    再読み込み
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