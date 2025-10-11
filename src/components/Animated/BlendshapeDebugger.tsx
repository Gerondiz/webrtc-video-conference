'use client';

import React, { useState, useEffect } from 'react';

interface BlendshapeDebuggerProps {
  blendshapes: Array<{ displayName: string; score: number }> | null;
}

export default function BlendshapeDebugger({ blendshapes }: BlendshapeDebuggerProps) {
  const [frozenData, setFrozenData] = useState<Array<{ displayName: string; score: number }> | null>(null);
  const [isFrozen, setIsFrozen] = useState(false);

  // Находим индекс максимального значения
  const findMaxIndex = (data: Array<{ score: number }>) => {
    if (!data || data.length === 0) return -1;
    let maxIndex = 0;
    let maxValue = data[0]?.score || 0;
    for (let i = 1; i < data.length; i++) {
      if ((data[i]?.score || 0) > maxValue) {
        maxValue = data[i].score;
        maxIndex = i;
      }
    }
    return maxIndex;
  };

  const currentData = isFrozen ? frozenData : blendshapes;
  const maxIndex = findMaxIndex(currentData || []);

  const handleFreeze = () => {
    if (blendshapes && !isFrozen) {
      setFrozenData([...blendshapes]);
      setIsFrozen(true);
    } else {
      setFrozenData(null);
      setIsFrozen(false);
    }
  };

  useEffect(() => {
    if (!blendshapes) {
      setFrozenData(null);
      setIsFrozen(false);
    }
  }, [blendshapes]);

  return (
    <div className="bg-gray-800 text-white p-3 rounded">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-sm">Blendshapes (MediaPipe)</h3>
        <button
          onClick={handleFreeze}
          className={`px-2 py-1 text-xs rounded text-white ${
            isFrozen ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isFrozen ? 'Разморозить' : 'Заморозить'}
        </button>
      </div>

      {/* 52 строки × 24px ≈ 1250px */}
      <div className="grid grid-cols-2 gap-1 text-xs font-mono max-h-[1250px] overflow-y-auto">
        {currentData && currentData.length > 0 ? (
          currentData.map((b, index) => (
            <div
              key={index}
              className={`flex justify-between p-1 rounded ${
                index === maxIndex && maxIndex > 0.5 ? 'bg-green-700' : 'bg-gray-700'
              }`}
            >
              <span>#{index}:</span>
              <span>{(b.score || 0).toFixed(2)}</span>
            </div>
          ))
        ) : (
          <div className="col-span-2 text-center py-4 text-gray-400">Нет данных</div>
        )}
      </div>
    </div>
  );
}