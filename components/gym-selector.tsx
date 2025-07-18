'use client'

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { MapPin, Search, Star, Plus, X } from 'lucide-react';

interface Gym {
  id: string;
  name: string;
  chainName: string;
  address: string;
  latitude: number;
  longitude: number;
  distance?: number;
}

interface UserGym {
  id: string;
  gymId: string;
  isPrimary: boolean;
  gym: Gym;
  createdAt: string;
}

interface GymSelectorProps {
  onGymSelect?: (gym: Gym) => void;
  selectedGyms?: UserGym[];
  onGymsChange?: (gyms: UserGym[]) => void;
}

export default function GymSelector({ onGymSelect, selectedGyms = [], onGymsChange }: GymSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChain, setSelectedChain] = useState('all');
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [chains, setChains] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // 位置情報取得
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log('位置情報取得に失敗:', error);
        }
      );
    }
  }, []);

  // チェーン一覧取得
  useEffect(() => {
    const fetchChains = async () => {
      try {
        const response = await fetch('/api/gyms/chains/list');
        const data = await response.json();
        setChains(data.chains);
      } catch (error) {
        console.error('チェーン一覧取得エラー:', error);
      }
    };

    fetchChains();
  }, []);

  // ジム検索
  const searchGyms = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (searchQuery) params.append('query', searchQuery);
      if (selectedChain !== 'all') params.append('chainName', selectedChain);
      if (userLocation) {
        params.append('latitude', userLocation.lat.toString());
        params.append('longitude', userLocation.lng.toString());
        params.append('radius', '20000'); // 20km
      }

      const response = await fetch(`/api/gyms/search?${params}`);
      const data = await response.json();
      setGyms(data.gyms);
    } catch (error) {
      console.error('ジム検索エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  // 検索実行
  useEffect(() => {
    searchGyms();
  }, [selectedChain, userLocation]);

  // ジム登録
  const registerGym = async (gym: Gym, isPrimary: boolean = false) => {
    try {
      const response = await fetch('/api/gyms/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gymId: gym.id,
          isPrimary
        })
      });

      if (response.ok) {
        const newUserGym = await response.json();
        const updatedGyms = [...selectedGyms, newUserGym];
        onGymsChange?.(updatedGyms);
        onGymSelect?.(gym);
      }
    } catch (error) {
      console.error('ジム登録エラー:', error);
    }
  };

  // ジム登録解除
  const unregisterGym = async (gymId: string) => {
    try {
      const response = await fetch(`/api/gyms/unregister/${gymId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        const updatedGyms = selectedGyms.filter(ug => ug.gymId !== gymId);
        onGymsChange?.(updatedGyms);
      }
    } catch (error) {
      console.error('ジム登録解除エラー:', error);
    }
  };

  // プライマリジム設定
  const setPrimaryGym = async (gymId: string) => {
    try {
      const response = await fetch(`/api/gyms/primary/${gymId}`, {
        method: 'PATCH'
      });

      if (response.ok) {
        const updatedGyms = selectedGyms.map(ug => ({
          ...ug,
          isPrimary: ug.gymId === gymId
        }));
        onGymsChange?.(updatedGyms);
      }
    } catch (error) {
      console.error('プライマリジム設定エラー:', error);
    }
  };

  const isGymSelected = (gymId: string) => {
    return selectedGyms.some(ug => ug.gymId === gymId);
  };

  return (
    <div className="space-y-6">
      {/* 登録済みジム一覧 */}
      {selectedGyms.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">登録済みジム</h3>
          <div className="grid gap-3">
            {selectedGyms.map((userGym) => (
              <Card key={userGym.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div>
                      <h4 className="font-medium">{userGym.gym.name}</h4>
                      <p className="text-sm text-gray-600">{userGym.gym.chainName}</p>
                      <p className="text-xs text-gray-500">{userGym.gym.address}</p>
                    </div>
                    {userGym.isPrimary && (
                      <Badge variant="default">
                        <Star className="w-3 h-3 mr-1" />
                        メイン
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {!userGym.isPrimary && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPrimaryGym(userGym.gymId)}
                      >
                        メインに設定
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => unregisterGym(userGym.gymId)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 検索フォーム */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">ジム検索</h3>
        
        <div className="flex space-x-2">
          <Input
            placeholder="ジム名、チェーン名、住所で検索"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Button onClick={searchGyms} disabled={loading}>
            <Search className="w-4 h-4 mr-2" />
            検索
          </Button>
        </div>

        <Select value={selectedChain} onValueChange={setSelectedChain}>
          <SelectTrigger>
            <SelectValue placeholder="チェーンで絞り込み" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべて</SelectItem>
            {chains.map((chain) => (
              <SelectItem key={chain} value={chain}>
                {chain}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 検索結果 */}
      <div className="space-y-3">
        {loading && (
          <div className="text-center py-8">
            <p className="text-gray-500">検索中...</p>
          </div>
        )}

        {!loading && gyms.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">ジムが見つかりませんでした</p>
          </div>
        )}

        {gyms.map((gym) => (
          <Card key={gym.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div>
                  <h4 className="font-medium">{gym.name}</h4>
                  <p className="text-sm text-gray-600">{gym.chainName}</p>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <MapPin className="w-3 h-3" />
                    <span>{gym.address}</span>
                    {gym.distance && (
                      <span>• {gym.distance.toFixed(1)}km</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {!isGymSelected(gym.id) ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => registerGym(gym, false)}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      登録
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => registerGym(gym, true)}
                    >
                      <Star className="w-4 h-4 mr-1" />
                      メインに設定
                    </Button>
                  </>
                ) : (
                  <Badge variant="secondary">登録済み</Badge>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}