
import React, { useMemo, useState } from 'react';
import type { OralAnalysis, OralIssue } from '../types';
import Icon from './Icon';
import { useLanguage } from '../contexts/LanguageContext';
import ImageWithBoundingBoxes from './ImageWithBoundingBoxes';

interface AnalysisResultDisplayProps {
  analysis: OralAnalysis;
  analysisIndex: number;
  onRemove: (index: number) => void;
}

const diseaseColorMap: Record<string, any> = {
    'K02.51 Dental caries on pit and fissure surface, limited to enamel': { border: 'border-red-500', bg: 'bg-red-500', bgOpacity: 'bg-red-500/30' },
    'K02.52 Dental caries on pit and fissure surface penetrating into dentin': { border: 'border-red-700', bg: 'bg-red-700', bgOpacity: 'bg-red-700/30' },
    'K00.4 Enamel hypoplasia': { border: 'border-purple-600', bg: 'bg-purple-600', bgOpacity: 'bg-purple-600/30' },
    'K07.3 Anomalies of tooth position (Crowding)': { border: 'border-indigo-600', bg: 'bg-indigo-600', bgOpacity: 'bg-indigo-600/30' },
    'TP.01 TriPlaque: New Plaque (<48h)': { border: 'border-pink-400', bg: 'bg-pink-400', bgOpacity: 'bg-pink-400/30' },
    'TP.02 TriPlaque: Old Plaque (>48h)': { border: 'border-purple-800', bg: 'bg-purple-800', bgOpacity: 'bg-purple-800/30' },
    'TP.03 TriPlaque: Acidic Plaque (High Risk)': { border: 'border-cyan-400', bg: 'bg-cyan-400', bgOpacity: 'bg-cyan-400/30' },
    'default': { border: 'border-gray-500', bg: 'bg-gray-500', bgOpacity: 'bg-gray-500/30' }
};

const AnalysisResultDisplay: React.FC<AnalysisResultDisplayProps> = ({ analysis, analysisIndex, onRemove }) => {
    const { t } = useLanguage();
    const issues = analysis.analysisResult?.issues ?? [];
    const uniqueTypes: string[] = Array.from(new Set(issues.map(i => i.diseaseName)));

    const renderBox = (issue: OralIssue, index: number) => {
      const config = diseaseColorMap[issue.diseaseName] || diseaseColorMap.default;
      return (
        <div className={`w-full h-full border-2 ${config.border} ${config.bgOpacity} rounded-sm relative shadow-sm ring-1 ring-inset ring-white/50`}>
            <span className={`absolute -top-2 -left-2 w-5 h-5 ${config.bg} text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white shadow-md z-20`}>
                {index + 1}
            </span>
        </div>
      );
    };

    return (
        <div className={`relative w-72 border rounded-lg shadow-sm bg-white overflow-hidden flex flex-col ${analysis.imageQuality === 'poor' ? 'border-red-300' : 'border-gray-200'}`}>
            <button onClick={() => onRemove(analysisIndex)} className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 z-30 transition-colors hover:bg-black/70">
                <Icon type="close" className="w-4 h-4" />
            </button>
            <div className="h-48 bg-gray-900 relative overflow-hidden">
                <ImageWithBoundingBoxes 
                  imageSrc={analysis.imagePreview} 
                  issues={issues} 
                  renderBoundingBoxContent={renderBox} 
                />
            </div>
            <div className="p-3 flex-grow bg-white">
                <h4 className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">{t('detectedIssues')}</h4>
                
                {analysis.imageQuality === 'checking' && (
                     <div className="flex items-center space-x-2 text-xs text-blue-600 mb-2 font-medium">
                        <div className="animate-spin h-3 w-3 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                        <span>{t('checkingQuality')}</span>
                    </div>
                )}
                
                {analysis.imageQuality === 'poor' && (
                    <div className="bg-red-50 p-2 rounded border border-red-200 mb-2">
                         <p className="text-[10px] text-red-700 font-bold">{t('poor')}: {analysis.qualityReason}</p>
                    </div>
                )}

                <ul className="space-y-1.5">
                    {uniqueTypes.length > 0 ? uniqueTypes.map((name, i) => (
                        <li key={i} className="text-[10px] flex items-start leading-tight text-gray-700">
                            <span className={`w-2.5 h-2.5 mt-0.5 mr-2 rounded-full flex-shrink-0 ${(diseaseColorMap[name] || diseaseColorMap.default).bg}`}></span>
                            {name}
                        </li>
                    )) : (
                        <li className="text-[10px] text-gray-400 italic font-medium">{t('readyForAnalysis')}</li>
                    )}
                </ul>
            </div>
        </div>
    );
};

export default AnalysisResultDisplay;
