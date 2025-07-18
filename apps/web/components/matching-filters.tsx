'use client'

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Slider } from './ui/slider';
import { Filter, X } from 'lucide-react';

interface Gym {
  id: string;
  name: string;
  chainName: string;
  address: string;
}

interface MatchingFilters {
  ageMin?: number;
  ageMax?: number;
  gender?: string;
  gymIds?: string[];
  trainingLevel?: string;
  timeSlots?: string[];
}

interface MatchingFiltersProps {
  filters: MatchingFilters;
  onFiltersChange: (filters: MatchingFilters) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
}

export default function MatchingFiltersComponent({
  filters,
  onFiltersChange,
  onApplyFilters,
  onClearFilters
}: MatchingFiltersProps) {
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [chains, setChains] = useState<string[]>([]);
  const [selectedChain, setSelectedChain] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // 年齢範囲の初期値
  const [ageRange, setAgeRange] = useState<[number, number]>([
    filters.ageMin || 18,
    filters.ageMax || 65
  ]);

  // ジムとチェーン一覧取得
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [gymsResponse, chainsResponse] = await Promise.all([
          fetch('/api/gyms/search?limit=100'),
          fetch('/api/gyms/chains/list')
        ]);

        const gymsData = await gymsResponse.json();
        const chainsData = await chainsResponse.json();

        setGyms(gymsData.gyms);
        setChains(chainsData.chains);
      } catch (error) {
        console.error('データ取得エラー:', error);
      }
    };

    fetchData();
  }, []);

  // フィルタリング済みジム一覧
  const filteredGyms = selectedChain === 'all' 
    ? gyms 
    : gyms.filter(gym => gym.chainName === selectedChain);

  // 年齢範囲更新
  const handleAgeRangeChange = (value: number[]) => {
    setAgeRange([value[0], value[1]]);
    onFiltersChange({
      ...filters,
      ageMin: value[0],
      ageMax: value[1]
    });
  };

  // 性別選択
  const handleGenderChange = (value: string) => {
    onFiltersChange({
      ...filters,
      gender: value === 'all' ? undefined : value
    });
  };

  // ジム選択
  const handleGymToggle = (gymId: string) => {
    const currentGymIds = filters.gymIds || [];
    const newGymIds = currentGymIds.includes(gymId)
      ? currentGymIds.filter(id => id !== gymId)
      : [...currentGymIds, gymId];

    onFiltersChange({
      ...filters,
      gymIds: newGymIds.length > 0 ? newGymIds : undefined
    });
  };

  // トレーニングレベル選択
  const handleTrainingLevelChange = (value: string) => {
    onFiltersChange({
      ...filters,
      trainingLevel: value === 'all' ? undefined : value
    });
  };

  // 時間帯選択
  const handleTimeSlotToggle = (timeSlot: string) => {
    const currentTimeSlots = filters.timeSlots || [];
    const newTimeSlots = currentTimeSlots.includes(timeSlot)
      ? currentTimeSlots.filter(slot => slot !== timeSlot)
      : [...currentTimeSlots, timeSlot];

    onFiltersChange({
      ...filters,
      timeSlots: newTimeSlots.length > 0 ? newTimeSlots : undefined
    });
  };

  // 選択されたジム名を取得
  const getSelectedGymNames = () => {
    if (!filters.gymIds) return [];
    return gyms
      .filter(gym => filters.gymIds!.includes(gym.id))
      .map(gym => gym.name);
  };

  // アクティブなフィルタ数を計算
  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.ageMin !== 18 || filters.ageMax !== 65) count++;
    if (filters.gender) count++;
    if (filters.gymIds && filters.gymIds.length > 0) count++;
    if (filters.trainingLevel) count++;
    if (filters.timeSlots && filters.timeSlots.length > 0) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className="space-y-4">
      {/* フィルタボタン */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="relative"
        >
          <Filter className="w-4 h-4 mr-2" />
          フィルタ
          {activeFiltersCount > 0 && (
            <Badge variant="destructive" className="ml-2 px-1 py-0 text-xs">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>

        <div className="flex space-x-2">
          <Button variant="outline" onClick={onApplyFilters}>
            適用
          </Button>
          {activeFiltersCount > 0 && (
            <Button variant="ghost" onClick={onClearFilters}>
              クリア
            </Button>
          )}
        </div>
      </div>

      {/* アクティブなフィルタ表示 */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {(filters.ageMin !== 18 || filters.ageMax !== 65) && (
            <Badge variant="secondary">
              年齢: {filters.ageMin}-{filters.ageMax}歳
            </Badge>
          )}
          {filters.gender && (
            <Badge variant="secondary">
              性別: {filters.gender === 'male' ? '男性' : '女性'}
            </Badge>
          )}
          {filters.gymIds && filters.gymIds.length > 0 && (
            <Badge variant="secondary">
              ジム: {getSelectedGymNames().length}件選択
            </Badge>
          )}
          {filters.trainingLevel && (
            <Badge variant="secondary">
              レベル: {
                filters.trainingLevel === 'beginner' ? '初心者' :
                filters.trainingLevel === 'intermediate' ? '中級者' : '上級者'
              }
            </Badge>
          )}
          {filters.timeSlots && filters.timeSlots.length > 0 && (
            <Badge variant="secondary">
              時間帯: {filters.timeSlots.length}件選択
            </Badge>
          )}
        </div>
      )}

      {/* フィルタ詳細 */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle>フィルタ設定</CardTitle>
            <CardDescription>
              マッチング候補を絞り込むためのフィルタを設定してください
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 年齢範囲 */}
            <div className="space-y-2">
              <Label>年齢範囲</Label>
              <div className="px-3">
                <Slider
                  value={ageRange}
                  onValueChange={handleAgeRangeChange}
                  min={18}
                  max={65}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-500 mt-1">
                  <span>{ageRange[0]}歳</span>
                  <span>{ageRange[1]}歳</span>
                </div>
              </div>
            </div>

            {/* 性別 */}
            <div className="space-y-2">
              <Label>性別</Label>
              <Select value={filters.gender || 'all'} onValueChange={handleGenderChange}>
                <SelectTrigger>
                  <SelectValue placeholder="性別を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="male">男性</SelectItem>
                  <SelectItem value="female">女性</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* ジム選択 */}
            <div className="space-y-2">
              <Label>ジム</Label>
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
              
              <div className="max-h-32 overflow-y-auto space-y-1">
                {filteredGyms.map((gym) => (
                  <div
                    key={gym.id}
                    className={`p-2 rounded cursor-pointer text-sm ${
                      filters.gymIds?.includes(gym.id)
                        ? 'bg-blue-100 border-blue-300'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                    onClick={() => handleGymToggle(gym.id)}
                  >
                    <div className="font-medium">{gym.name}</div>
                    <div className="text-xs text-gray-500">{gym.chainName}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* トレーニングレベル */}
            <div className="space-y-2">
              <Label>トレーニングレベル</Label>
              <Select value={filters.trainingLevel || 'all'} onValueChange={handleTrainingLevelChange}>
                <SelectTrigger>
                  <SelectValue placeholder="レベルを選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="beginner">初心者（1年未満）</SelectItem>
                  <SelectItem value="intermediate">中級者（1-3年）</SelectItem>
                  <SelectItem value="advanced">上級者（3年以上）</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 時間帯 */}
            <div className="space-y-2">
              <Label>トレーニング時間帯</Label>
              <div className="flex flex-wrap gap-2">
                {['morning', 'afternoon', 'evening', 'night'].map((timeSlot) => (
                  <Button
                    key={timeSlot}
                    variant={filters.timeSlots?.includes(timeSlot) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleTimeSlotToggle(timeSlot)}
                  >
                    {timeSlot === 'morning' ? '朝' :
                     timeSlot === 'afternoon' ? '昼' :
                     timeSlot === 'evening' ? '夕' : '夜'}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}