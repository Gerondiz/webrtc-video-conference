// src/data/emotionMapping.ts
export interface EmotionMapItem {
    name: string;
    mediaPipeIndex: number;
    morphName: string;
    intensity?: number;
}

export const emotionMapping: EmotionMapItem[] = [
    { name: 'ALL_Neutral', mediaPipeIndex: 0, morphName: 'Fcl_ALL_Neutral', intensity: 2.0 },
    { name: 'ALL_Angry', mediaPipeIndex: 42, morphName: 'Fcl_ALL_Angry' },
    { name: 'ALL_Fun', mediaPipeIndex: 44, morphName: 'Fcl_ALL_Fun' },
    { name: 'ALL_Joy', mediaPipeIndex: 45, morphName: 'Fcl_ALL_Joy' },
    { name: 'ALL_Sorrow', mediaPipeIndex: 38, morphName: 'Fcl_ALL_Sorrow' },
    { name: 'ALL_Surprised', mediaPipeIndex: 25, morphName: 'Fcl_ALL_Surprised' },
    { name: 'BRW_Angry', mediaPipeIndex: 2, morphName: 'Fcl_BRW_Angry' },
    { name: 'BRW_Fun', mediaPipeIndex: 3, morphName: 'Fcl_BRW_Fun' },
    { name: 'BRW_Joy', mediaPipeIndex: 4, morphName: 'Fcl_BRW_Joy' },
    { name: 'BRW_Sorrow', mediaPipeIndex: 1, morphName: 'Fcl_BRW_Sorrow' },
    // { name: 'BRW_Surprised', mediaPipeIndex: 25, morphName: 'Fcl_BRW_Surprised' },
    { name: 'EYE_Close', mediaPipeIndex: 12, morphName: 'Fcl_EYE_Close' },
    { name: 'EYE_Close_L', mediaPipeIndex: 19, morphName: 'Fcl_EYE_Close_L' },
    { name: 'EYE_Close_R', mediaPipeIndex: 20, morphName: 'Fcl_EYE_Close_R' },
    { name: 'MTH_A', mediaPipeIndex: 25, morphName: 'Fcl_MTH_A' },
];

// ang 2