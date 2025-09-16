'use client';
import { useState, useEffect } from 'react';
import Button from '../ui/Button';
import { FiChevronDown, FiChevronRight, FiBookOpen, FiZap, FiTarget, FiStar, FiLayers, FiMaximize, FiMinimize } from 'react-icons/fi';

interface MindMapNode {
  name: string;
  description?: string;
  keyPoints?: string[];
  examples?: string[];
  formula?: string;
  children?: MindMapNode[];
}

const MindMapNodeComponent = ({ node, level = 0, expandAll, collapseAll }: { node: MindMapNode; level?: number; expandAll: boolean; collapseAll: boolean }) => {
  const [isExpanded, setIsExpanded] = useState(level < 2);
  const hasChildren = node.children && node.children.length > 0;
  
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };
  
  useEffect(() => {
    if (expandAll) {
      setIsExpanded(true);
    } else if (collapseAll) {
      setIsExpanded(false);
    }
  }, [expandAll, collapseAll]);
  
  const getNodeStyles = (level: number) => {
    const styles = [
      {
        bg: 'bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/40 dark:to-indigo-900/40',
        border: 'border-purple-300 dark:border-purple-600',
        textColor: 'text-purple-900 dark:text-purple-100',
        icon: <FiTarget className="w-4 h-4 text-purple-600 dark:text-purple-400" />
      },
      {
        bg: 'bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/40 dark:to-cyan-900/40',
        border: 'border-blue-300 dark:border-blue-600',
        textColor: 'text-blue-900 dark:text-blue-100',
        icon: <FiBookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
      },
      {
        bg: 'bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40',
        border: 'border-green-300 dark:border-green-600',
        textColor: 'text-green-900 dark:text-green-100',
        icon: <FiLayers className="w-3 h-3 text-green-600 dark:text-green-400" />
      },
      {
        bg: 'bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/40 dark:to-red-900/40',
        border: 'border-orange-300 dark:border-orange-600',
        textColor: 'text-orange-900 dark:text-orange-100',
        icon: <FiZap className="w-3 h-3 text-orange-600 dark:text-orange-400" />
      },
      {
        bg: 'bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/40 dark:to-rose-900/40',
        border: 'border-pink-300 dark:border-pink-600',
        textColor: 'text-pink-900 dark:text-pink-100',
        icon: <FiStar className="w-3 h-3 text-pink-600 dark:text-pink-400" />
      },
      {
        bg: 'bg-gradient-to-br from-yellow-100 to-amber-100 dark:from-yellow-900/40 dark:to-amber-900/40',
        border: 'border-yellow-300 dark:border-yellow-600',
        textColor: 'text-yellow-900 dark:text-yellow-100',
        icon: <FiTarget className="w-3 h-3 text-yellow-600 dark:text-yellow-400" />
      }
    ];
    return styles[level % styles.length];
  };
  
  const nodeStyle = getNodeStyles(level);
  const marginLeft = level === 0 ? '' : `ml-3 sm:ml-4 md:ml-6 lg:ml-8`;
  
  return (
    <div className={`${marginLeft} mb-2 relative`}>
      {level > 0 && (
        <div className="absolute -left-4 top-6 w-4 h-px bg-gradient-to-r from-indigo-400 via-purple-400 to-transparent dark:from-indigo-500 dark:via-purple-500"></div>
      )}
      
      <div className={`mindmap-node ${nodeStyle.bg} ${nodeStyle.textColor} rounded-2xl p-3 sm:p-4 shadow-lg border ${nodeStyle.border} relative overflow-hidden min-w-0 max-w-full`}>


        
        <div className="flex items-start justify-between relative z-10">
          <div className="flex items-start gap-3 flex-1">
            <div className="p-2 bg-white/70 dark:bg-gray-800/70 rounded-xl border border-gray-200 dark:border-gray-600">
              {nodeStyle.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                  level === 0 ? 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/50 dark:text-purple-300 dark:border-purple-600' :
                  level === 1 ? 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-600' :
                  level === 2 ? 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/50 dark:text-green-300 dark:border-green-600' :
                  level === 3 ? 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/50 dark:text-orange-300 dark:border-orange-600' :
                  level === 4 ? 'bg-pink-100 text-pink-700 border-pink-300 dark:bg-pink-900/50 dark:text-pink-300 dark:border-pink-600' :
                  'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-600'
                }`}>
                  Level {level + 1}
                </span>
              </div>
              <h3 className={`font-bold leading-tight break-words ${level === 0 ? 'text-sm md:text-base' : level === 1 ? 'text-xs md:text-sm' : 'text-xs'}`} style={{ color: 'inherit' }}>
                {node.name}
              </h3>
              {node.description && (
                <div className="text-xs opacity-80 leading-tight mt-2 break-words" style={{ color: 'inherit' }} dangerouslySetInnerHTML={{ __html: node.description }} />
              )}
              <div className="text-xs mt-2 p-2 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-600">
                <span className="font-medium" style={{ color: 'inherit' }}>
                  {node.keyPoints && node.keyPoints.length > 0 && `${node.keyPoints.length} key points`}
                  {node.examples && node.examples.length > 0 && (node.keyPoints && node.keyPoints.length > 0 ? ` • ${node.examples.length} examples` : `${node.examples.length} examples`)}
                  {node.formula && (node.keyPoints || node.examples ? ' • Formula included' : 'Formula included')}
                  {hasChildren && (node.keyPoints || node.examples || node.formula ? ` • ${node.children!.length} subtopics` : `${node.children!.length} subtopics`)}
                  {!node.keyPoints && !node.examples && !node.formula && !hasChildren && 'Overview content'}
                </span>
              </div>
            </div>
          </div>
          
          {hasChildren && (
            <button 
              onClick={toggleExpanded} 
              className="p-2 bg-white/50 dark:bg-gray-800/50 rounded-xl transition-all duration-300 ml-2 flex-shrink-0 border border-gray-200 dark:border-gray-600"
            >
              {isExpanded ? <FiChevronDown className="w-3 h-3 text-gray-600 dark:text-gray-400" /> : <FiChevronRight className="w-3 h-3 text-gray-600 dark:text-gray-400" />}
            </button>
          )}
        </div>
        
        <div className="mt-3 space-y-3 relative z-10">
          {node.keyPoints && node.keyPoints.length > 0 && (
            <div className="glass-card rounded-xl p-3 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 to-orange-400"></div>
              <div className="flex items-center gap-2 mb-2">
                <FiStar className="w-3 h-3 text-yellow-500" />
                <h4 className="text-xs font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">KEY POINTS</h4>
              </div>
              <ul className="space-y-2">
                {node.keyPoints.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs leading-tight">
                    <div className="w-1.5 h-1.5 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full mt-1 flex-shrink-0"></div>
                    <span dangerouslySetInnerHTML={{ __html: point }} className="flex-1 text-gray-700 dark:text-gray-300" />
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {node.examples && node.examples.length > 0 && (
            <div className="glass-card rounded-xl p-3 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-emerald-400"></div>
              <h4 className="text-xs font-bold mb-2 flex items-center gap-2">
                <span>💡</span>
                <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">EXAMPLES</span>
              </h4>
              <div className="space-y-2">
                {node.examples.map((example, idx) => {
                  // Check if example contains code patterns
                  const isCodeExample = /[(){}=;]|function|if|for|while|class|var|let|const/.test(example);
                  return (
                    <div 
                      key={idx} 
                      className={`glass-card rounded-lg p-3 text-xs leading-tight overflow-x-auto whitespace-pre-wrap break-words ${
                        isCodeExample ? 'font-mono bg-slate-900/90 text-green-400 border border-slate-700' : 'text-gray-700 dark:text-gray-300'
                      }`}
                      dangerouslySetInnerHTML={{ __html: example }} 
                    />
                  );
                })}
              </div>
            </div>
          )}
          
          {node.formula && (
            <div className="glass-card rounded-xl p-3 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 to-pink-400"></div>
              <h4 className="text-xs font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">FORMULA</h4>
              <div className="glass-card rounded-lg p-3 font-mono text-xs text-gray-800 dark:text-gray-200" dangerouslySetInnerHTML={{ __html: node.formula }} />
            </div>
          )}
        </div>
      </div>
      
      {hasChildren && isExpanded && (
        <div className="mt-3 ml-3 sm:ml-4 relative">
          <div className="absolute -left-3 sm:-left-4 top-0 bottom-0 w-px bg-gradient-to-b from-indigo-400 via-purple-400 to-transparent dark:from-indigo-500 dark:via-purple-500"></div>
          <div className="space-y-3 pb-3">
            {node.children!.map((child, idx) => (
              <MindMapNodeComponent key={idx} node={child} level={level + 1} expandAll={expandAll} collapseAll={collapseAll} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};


const MindMap = ({ data }: { data: MindMapNode }) => {
  const [expandAll, setExpandAll] = useState(false);
  const [collapseAll, setCollapseAll] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const handleExpandAll = () => {
    setExpandAll(true);
    setCollapseAll(false);
    setTimeout(() => setExpandAll(false), 100);
  };
  
  const handleCollapseAll = () => {
    setCollapseAll(true);
    setExpandAll(false);
    setTimeout(() => setCollapseAll(false), 100);
  };
  
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };
  
  console.log('MindMap received data:', data);
  
  if (!data || (typeof data === 'object' && !data.name && !data.description && !data.keyPoints)) {
    return (
      <div className="min-h-[400px] flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-3xl border border-gray-200 dark:border-gray-700">
        <div className="text-center p-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 rounded-2xl flex items-center justify-center">
            <FiLayers className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">No mind map data available</p>
          <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">Generate content to see your interactive mind map</p>
        </div>
      </div>
    );
  }
  
  // Ensure data has the required structure
  const mindMapData = {
    name: data.name || 'Mind Map',
    description: data.description || '',
    keyPoints: data.keyPoints || [],
    examples: data.examples || [],
    children: data.children || []
  };
  
  return (
    <div className={`bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-slate-900 ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'rounded-3xl'} border border-gray-200/50 dark:border-gray-700/50 shadow-2xl backdrop-blur-sm overflow-hidden`}>
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-3 md:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-white mb-1">Interactive Mind Map</h2>
            <p className="text-indigo-100 text-xs md:text-sm">Explore concepts with visual connections</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button 
              onClick={handleExpandAll} 
              variant="secondary" 
              size="sm"
              className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm transition-all duration-200"
            >
              <FiLayers className="w-3 h-3 mr-1" />
              Expand All
            </Button>
            <Button 
              onClick={handleCollapseAll} 
              variant="secondary" 
              size="sm"
              className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm transition-all duration-200"
            >
              <FiTarget className="w-3 h-3 mr-1" />
              Collapse All
            </Button>
            <Button 
              onClick={toggleFullscreen} 
              variant="secondary" 
              size="sm"
              className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm transition-all duration-200"
            >
              {isFullscreen ? <FiMinimize className="w-3 h-3 mr-1" /> : <FiMaximize className="w-3 h-3 mr-1" />}
              {isFullscreen ? 'Exit' : 'Fullscreen'}
            </Button>
          </div>
        </div>
      </div>
      
      <div className="p-3 md:p-4">
        <div className={`${isFullscreen ? 'h-[calc(100vh-120px)]' : 'max-h-[400px] md:max-h-[500px]'} overflow-y-auto overflow-x-auto scrollbar-hide`}>
          <div className="min-w-full px-2 md:px-0 pb-8">
            <MindMapNodeComponent node={mindMapData} expandAll={expandAll} collapseAll={collapseAll} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MindMap;