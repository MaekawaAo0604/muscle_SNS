'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'react-hot-toast'
import GymSelector from '@/components/gym-selector'
import ImageUpload from '@/components/image-upload'

export default function ProfilePage() {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    nickname: '',
    age: '',
    gender: '',
    bio: '',
    experienceYears: '',
    frequencyPerWeek: '',
    benchPressWeight: '',
    squatWeight: '',
    deadliftWeight: '',
    favoriteBodyParts: '',
    trainingGoals: '',
  })
  
  const [isSaving, setIsSaving] = useState(false)
  const [userGyms, setUserGyms] = useState([])
  const [profileImage, setProfileImage] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isLoading, isAuthenticated, router])

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        nickname: user.nickname || '',
      }))
      setProfileImage(user.profileImageUrl || null)
    }
  }, [user])

  // ユーザーのジム一覧を取得
  useEffect(() => {
    const fetchUserGyms = async () => {
      try {
        const response = await fetch('/api/gyms/user/list')
        if (response.ok) {
          const data = await response.json()
          setUserGyms(data.gyms)
        }
      } catch (error) {
        console.error('ジム一覧取得エラー:', error)
      }
    }

    if (user) {
      fetchUserGyms()
    }
  }, [user])

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsSaving(true)
    try {
      const response = await fetch('/api/user/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          ...formData,
          age: formData.age ? parseInt(formData.age) : null,
          experienceYears: formData.experienceYears ? parseInt(formData.experienceYears) : null,
          frequencyPerWeek: formData.frequencyPerWeek ? parseInt(formData.frequencyPerWeek) : null,
          benchPressWeight: formData.benchPressWeight ? parseFloat(formData.benchPressWeight) : null,
          squatWeight: formData.squatWeight ? parseFloat(formData.squatWeight) : null,
          deadliftWeight: formData.deadliftWeight ? parseFloat(formData.deadliftWeight) : null,
        }),
      })

      if (response.ok) {
        toast.success('プロフィールを保存しました')
        router.push('/dashboard')
      } else {
        toast.error('プロフィールの保存に失敗しました')
      }
    } catch (error) {
      toast.error('エラーが発生しました')
    } finally {
      setIsSaving(false)
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
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">プロフィール設定</CardTitle>
              <CardDescription>
                より良いマッチングのために、あなたの情報を教えてください
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* プロフィール画像 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">プロフィール画像</h3>
                  <ImageUpload
                    currentImage={profileImage}
                    onImageUpload={setProfileImage}
                    onImageRemove={() => setProfileImage(null)}
                    size="lg"
                  />
                </div>

                {/* 基本情報 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">基本情報</h3>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nickname">ニックネーム</Label>
                      <Input
                        id="nickname"
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
                        min="18"
                        max="100"
                        value={formData.age}
                        onChange={(e) => handleChange('age', e.target.value)}
                      />
                    </div>
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

                  <div className="space-y-2">
                    <Label htmlFor="bio">自己紹介</Label>
                    <Textarea
                      id="bio"
                      placeholder="あなたについて簡単に教えてください"
                      value={formData.bio}
                      onChange={(e) => handleChange('bio', e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>

                {/* トレーニング情報 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">トレーニング情報</h3>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="experienceYears">トレーニング歴（年）</Label>
                      <Input
                        id="experienceYears"
                        type="number"
                        min="0"
                        max="50"
                        value={formData.experienceYears}
                        onChange={(e) => handleChange('experienceYears', e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="frequencyPerWeek">週何回</Label>
                      <Input
                        id="frequencyPerWeek"
                        type="number"
                        min="1"
                        max="7"
                        value={formData.frequencyPerWeek}
                        onChange={(e) => handleChange('frequencyPerWeek', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="benchPressWeight">ベンチプレス（kg）</Label>
                      <Input
                        id="benchPressWeight"
                        type="number"
                        step="0.5"
                        min="0"
                        value={formData.benchPressWeight}
                        onChange={(e) => handleChange('benchPressWeight', e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="squatWeight">スクワット（kg）</Label>
                      <Input
                        id="squatWeight"
                        type="number"
                        step="0.5"
                        min="0"
                        value={formData.squatWeight}
                        onChange={(e) => handleChange('squatWeight', e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="deadliftWeight">デッドリフト（kg）</Label>
                      <Input
                        id="deadliftWeight"
                        type="number"
                        step="0.5"
                        min="0"
                        value={formData.deadliftWeight}
                        onChange={(e) => handleChange('deadliftWeight', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="favoriteBodyParts">好きな部位</Label>
                    <Input
                      id="favoriteBodyParts"
                      placeholder="例: 胸、背中、脚"
                      value={formData.favoriteBodyParts}
                      onChange={(e) => handleChange('favoriteBodyParts', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="trainingGoals">トレーニング目標</Label>
                    <Input
                      id="trainingGoals"
                      placeholder="例: 筋肥大、減量、パワーアップ"
                      value={formData.trainingGoals}
                      onChange={(e) => handleChange('trainingGoals', e.target.value)}
                    />
                  </div>
                </div>

                {/* ジム選択 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">ジム選択</h3>
                  <GymSelector
                    selectedGyms={userGyms}
                    onGymsChange={setUserGyms}
                  />
                </div>

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/dashboard')}
                    className="flex-1"
                  >
                    キャンセル
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1"
                  >
                    {isSaving ? '保存中...' : 'プロフィールを保存'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}