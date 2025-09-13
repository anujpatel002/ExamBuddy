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
        bg: 'bg-gray-100 dark:bg-gray-700',
        border: 'border-gray-300 dark:border-gray-600',
        shadow: 'shadow-gray-200 dark:shadow-gray-800',
        textColor: 'text-gray-900 dark:text-gray-100',
        icon: <FiTarget className="w-4 h-4" />
      },
      {
        bg: 'bg-blue-50 dark:bg-blue-900/30',
        border: 'border-blue-200 dark:border-blue-700',
        shadow: 'shadow-blue-100 dark:shadow-blue-900',
        textColor: 'text-blue-900 dark:text-blue-100',
        icon: <FiBookOpen className="w-4 h-4" />
      },
      {
        bg: 'bg-green-50 dark:bg-green-900/30',
        border: 'border-green-200 dark:border-green-700',
        shadow: 'shadow-green-100 dark:shadow-green-900',
        textColor: 'text-green-900 dark:text-green-100',
        icon: <FiLayers className="w-3 h-3" />
      },
      {
        bg: 'bg-orange-50 dark:bg-orange-900/30',
        border: 'border-orange-200 dark:border-orange-700',
        shadow: 'shadow-orange-100 dark:shadow-orange-900',
        textColor: 'text-orange-900 dark:text-orange-100',
        icon: <FiZap className="w-3 h-3" />
      }
    ];
    return styles[level % styles.length];
  };
  
  const nodeStyle = getNodeStyles(level);
  const marginLeft = level === 0 ? '' : `ml-3 sm:ml-4 md:ml-6 lg:ml-8`;
  
  return (
    <div className={`${marginLeft} mb-2 relative`}>
      {level > 0 && (
        <div className="absolute -left-4 top-6 w-4 h-px bg-gradient-to-r from-gray-300 to-transparent dark:from-gray-600"></div>
      )}
      
      <div className={`${nodeStyle.bg} ${nodeStyle.border} ${nodeStyle.shadow} ${nodeStyle.textColor} border rounded-lg p-2 sm:p-3 shadow-md hover:shadow-lg transition-all duration-200 relative overflow-hidden min-w-0 max-w-full`}>

        
        <div className="flex items-start justify-between relative z-10">
          <div className="flex items-start gap-2 flex-1">
            <div className="p-1 bg-gray-200 dark:bg-gray-600 rounded">
              {nodeStyle.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={`font-semibold leading-tight break-words ${level === 0 ? 'text-sm md:text-base' : level === 1 ? 'text-xs md:text-sm' : 'text-xs'}`}>
                {node.name}
              </h3>
              {node.description && (
                <div className="text-xs opacity-80 leading-tight mt-1 break-words" dangerouslySetInnerHTML={{ __html: node.description }} />
              )}
            </div>
          </div>
          
          {hasChildren && (
            <button 
              onClick={toggleExpanded} 
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-all duration-200 ml-2 flex-shrink-0"
            >
              {isExpanded ? <FiChevronDown className="w-3 h-3" /> : <FiChevronRight className="w-3 h-3" />}
            </button>
          )}
        </div>
        
        <div className="mt-2 space-y-2 relative z-10">
          {node.keyPoints && node.keyPoints.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded p-2 border border-gray-200 dark:border-gray-600">
              <div className="flex items-center gap-1 mb-1">
                <FiStar className="w-2 h-2" />
                <h4 className="text-xs font-semibold">KEY POINTS</h4>
              </div>
              <ul className="space-y-1">
                {node.keyPoints.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-1 text-xs leading-tight">
                    <div className="w-1 h-1 bg-gray-600 dark:bg-gray-300 rounded-full mt-1 flex-shrink-0"></div>
                    <span dangerouslySetInnerHTML={{ __html: point }} className="flex-1" />
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {node.examples && node.examples.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded p-2 border border-gray-200 dark:border-gray-600">
              <h4 className="text-xs font-semibold mb-1 flex items-center gap-1">
                <span>💡</span>
                EXAMPLES
              </h4>
              <div className="space-y-1">
                {node.examples.map((example, idx) => {
                  // Check if example contains code patterns
                  const isCodeExample = /[(){}=;]|function|if|for|while|class|var|let|const/.test(example);
                  return (
                    <div 
                      key={idx} 
                      className={`bg-gray-100 dark:bg-gray-700 rounded p-2 text-xs leading-tight border border-gray-200 dark:border-gray-600 overflow-x-auto whitespace-pre-wrap break-words ${
                        isCodeExample ? 'font-mono bg-slate-900 text-green-400 border-slate-700' : ''
                      }`}
                      dangerouslySetInnerHTML={{ __html: example }} 
                    />
                  );
                })}
              </div>
            </div>
          )}
          
          {node.formula && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded p-2 border border-gray-200 dark:border-gray-600">
              <h4 className="text-xs font-semibold mb-1">FORMULA</h4>
              <div className="bg-gray-100 dark:bg-gray-700 rounded p-1 font-mono text-xs border border-gray-200 dark:border-gray-600" dangerouslySetInnerHTML={{ __html: node.formula }} />
            </div>
          )}
        </div>
      </div>
      
      {hasChildren && isExpanded && (
        <div className="mt-2 ml-2 sm:ml-3 relative">
          <div className="absolute -left-2 sm:-left-3 top-0 bottom-0 w-px bg-gradient-to-b from-gray-300 via-gray-400 to-transparent dark:from-gray-600 dark:via-gray-500"></div>
          <div className="space-y-2 pb-2">
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