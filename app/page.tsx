import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
            合トレマッチング
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 mb-12">
            一緒にトレーニングする仲間を見つけよう
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="text-4xl mb-4">💪</div>
              <h3 className="text-xl font-semibold mb-2">同じレベルの仲間</h3>
              <p className="text-gray-600">
                あなたと同じトレーニングレベルの仲間を見つけられます
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="text-4xl mb-4">🏋️</div>
              <h3 className="text-xl font-semibold mb-2">同じジムで</h3>
              <p className="text-gray-600">
                同じジムに通っている人とマッチングできます
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="text-4xl mb-4">📅</div>
              <h3 className="text-xl font-semibold mb-2">都合の良い時間に</h3>
              <p className="text-gray-600">
                お互いの都合が合う時間帯でトレーニング
              </p>
            </div>
          </div>
          
          <div className="flex gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="px-8 py-6 text-lg">
                今すぐ始める
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="px-8 py-6 text-lg">
                ログイン
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}