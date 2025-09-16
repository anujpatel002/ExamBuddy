'use client';
import { useState, useEffect, useMemo } from 'react';
import { FiMaximize, FiMinimize } from 'react-icons/fi';
import { validateMindMapJson, sanitizeHtml } from '@/utils/sanitization';

interface MindMapNode {
  id: string;
  title: string;
  children: MindMapNode[];
  level: number;
}

interface NotebookMindMapProps {
  content: string;
}

export default function NotebookMindMap({ content }: NotebookMindMapProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [nodes, setNodes] = useState<MindMapNode[]>([]);
  const [zoom, setZoom] = useState(0.8);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [animatingNodes, setAnimatingNodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    const parsedNodes = parseContent(content);
    setNodes(parsedNodes);
    // Start with root node expanded
    if (parsedNodes.length > 0) {
      setExpandedNodes(new Set([parsedNodes[0].id]));
    }
  }, [content]);

  const parseContent = (text: string): MindMapNode[] => {
    if (!text || text.trim() === '') {
      return [];
    }

    // Try to parse JSON structure first
    try {
      const jsonData = JSON.parse(text);
      if (validateMindMapJson(jsonData)) {
        return [convertJsonToNodes(jsonData)];
      }
    } catch (e) {
      // Not JSON, continue with text parsing
    }

    const lines = text.split('\n').filter(line => line.trim());
    const nodes: MindMapNode[] = [];
    const stack: MindMapNode[] = [];

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      let level = 0;
      let title = trimmed;

      // Handle markdown headers
      if (trimmed.startsWith('##### ')) {
        level = 5;
        title = trimmed.replace(/^#####\s*/, '');
      } else if (trimmed.startsWith('#### ')) {
        level = 4;
        title = trimmed.replace(/^####\s*/, '');
      } else if (trimmed.startsWith('### ')) {
        level = 3;
        title = trimmed.replace(/^###\s*/, '');
      } else if (trimmed.startsWith('## ')) {
        level = 2;
        title = trimmed.replace(/^##\s*/, '');
      } else if (trimmed.startsWith('# ')) {
        level = 1;
        title = trimmed.replace(/^#\s*/, '');
      } else if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        level = 6;
        title = trimmed.replace(/^[*-]\s*/, '');
      } else if (trimmed.match(/^\d+\./)) {
        level = 6;
        title = trimmed.replace(/^\d+\.\s*/, '');
      } else {
        // Include regular text as level 6 nodes
        level = 6;
      }

      // Clean and sanitize title
      title = sanitizeHtml(title.replace(/[*_`]/g, ''));
      if (!title.trim()) return;

      const node: MindMapNode = {
        id: `node-${index}`,
        title: title.trim(),
        children: [],
        level
      };

      // Build hierarchy
      while (stack.length > 0 && stack[stack.length - 1].level >= level) {
        stack.pop();
      }

      if (stack.length === 0) {
        nodes.push(node);
      } else {
        stack[stack.length - 1].children.push(node);
      }

      stack.push(node);
    });

    // If no structured content found, create a simple structure
    if (nodes.length === 0 && text.trim()) {
      return [{
        id: 'root',
        title: 'Content Overview',
        children: [{
          id: 'content-1',
          title: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
          children: [],
          level: 2
        }],
        level: 1
      }];
    }

    return nodes;
  };

  const convertJsonToNodes = (jsonData: any): MindMapNode => {
    return {
      id: jsonData.id || 'root',
      title: jsonData.name || 'Root',
      children: (jsonData.children || []).map((child: any, index: number) => convertJsonToNodes(child)),
      level: 1
    };
  };

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  // Memoize text wrapping function for better performance
  const wrapText = useMemo(() => {
    return (text: string, maxWidth: number) => {
      const words = text.split(' ');
      const lines: string[] = [];
      let currentLine = '';
      
      // Use more accurate text measurement
      const avgCharWidth = 7; // More realistic average character width
      
      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        if (testLine.length * avgCharWidth <= maxWidth) {
          currentLine = testLine;
        } else {
          if (currentLine) lines.push(currentLine);
          currentLine = word;
        }
      }
      if (currentLine) lines.push(currentLine);
      return lines;
    };
  }, []);

  const renderNode = (node: MindMapNode, x: number, y: number, isRoot: boolean = false) => {
    const maxTextWidth = isRoot ? 280 : 220;
    const wrappedLines = wrapText(node.title, maxTextWidth);
    const lineHeight = 18;
    const padding = 16;
    const nodeHeight = Math.max(40, wrappedLines.length * lineHeight + padding);
    const nodeWidth = Math.max(maxTextWidth + 40, 140);
    const hasChildren = node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);

    return (
      <g key={node.id}>
        <rect
          x={x}
          y={y}
          width={nodeWidth}
          height={nodeHeight}
          rx="17"
          className={`
            ${isRoot ? 'fill-blue-600' : node.level === 1 ? 'fill-slate-600' : 'fill-green-600'}
            ${hasChildren ? 'cursor-pointer hover:opacity-80' : ''}
            transition-opacity
          `}
          onClick={() => hasChildren && toggleNode(node.id)}
        />
        
        {wrappedLines.map((line, index) => (
          <text
            key={index}
            x={x + nodeWidth / 2}
            y={y + padding/2 + lineHeight + (index * lineHeight)}
            textAnchor="middle"
            className="fill-white text-sm font-medium pointer-events-none"
          >
            {line}
          </text>
        ))}
      </g>
    );
  };

  const renderMindMap = () => {
    if (nodes.length === 0) return null;

    const rootNode = nodes[0];
    const rootX = 100;
    const rootY = 400;
    const rootWidth = Math.max(rootNode.title.length * 8 + 40, 250);

    return (
      <g>
        {/* Root node */}
        {(() => {
          const rootLines = wrapText(rootNode.title, rootWidth - 60);
          const rootHeight = Math.max(60, rootLines.length * 20 + 30);
          return (
            <>
              <rect
                x={rootX}
                y={rootY - rootHeight/2}
                width={rootWidth}
                height={rootHeight}
                rx="25"
                className="fill-blue-600 cursor-pointer hover:opacity-80"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNode(rootNode.id);
                }}
                onMouseDown={(e) => e.stopPropagation()}
              />
              {rootLines.map((line, index) => (
                <text
                  key={index}
                  x={rootX + rootWidth/2}
                  y={rootY - rootHeight/2 + 25 + (index * 20)}
                  textAnchor="middle"
                  className="fill-white text-base font-bold pointer-events-none"
                >
                  {line}
                </text>
              ))}
            </>
          );
        })()}
        
        {/* Expand indicator for root - positioned outside on the right */}
        {rootNode.children.length > 0 && (
          <circle
            cx={rootX + rootWidth + 20}
            cy={rootY}
            r="12"
            className="fill-blue-500 cursor-pointer hover:fill-blue-400 transition-all duration-500 ease-in-out"
            onClick={(e) => {
              e.stopPropagation();
              toggleNode(rootNode.id);
            }}
          />
        )}
        {rootNode.children.length > 0 && (
          <text
            x={rootX + rootWidth + 20}
            y={rootY + 4}
            textAnchor="middle"
            className="fill-white text-sm font-bold pointer-events-none transition-all duration-500 ease-in-out"
          >
            {expandedNodes.has(rootNode.id) ? '−' : '+'}
          </text>
        )}
        
        {/* Main branches - extend to the right */}
        {expandedNodes.has(rootNode.id) && rootNode.children.map((child, index) => {
          // Calculate space needed for each node including its expanded children
          const calculateRequiredSpace = (node: MindMapNode): number => {
            if (!expandedNodes.has(node.id) || node.children.length === 0) return 120;
            
            // Calculate space for sub-children
            let subChildrenSpace = 0;
            node.children.forEach(subChild => {
              if (expandedNodes.has(subChild.id) && subChild.children.length > 0) {
                subChildrenSpace += subChild.children.length * 60;
              } else {
                subChildrenSpace += 80;
              }
            });
            
            return Math.max(160, subChildrenSpace + 60);
          };
          
          // Calculate positions with proper spacing
          const spaces = rootNode.children.map(calculateRequiredSpace);
          const totalSpace = spaces.reduce((sum, space) => sum + space, 0);
          
          let cumulativeY = rootY - totalSpace / 2;
          for (let i = 0; i < index; i++) {
            cumulativeY += spaces[i];
          }
          
          const horizontalOffset = 450;
          const childX = rootX + rootWidth + horizontalOffset;
          const childY = cumulativeY + spaces[index] / 2;
          const childWidth = Math.max(child.title.length * 7 + 30, 200);
          
          return (
            <g key={child.id}>
              {/* Connection line from expand button */}
              <line
                x1={rootX + rootWidth + 20}
                y1={rootY}
                x2={childX}
                y2={childY}
                stroke="#64748b"
                strokeWidth="3"
                className="opacity-70 transition-all duration-500 ease-in-out"
              />
              
              {/* Child node */}
              {(() => {
                const childLines = wrapText(child.title, childWidth - 40);
                const childHeight = Math.max(40, childLines.length * 16 + 20);
                return (
                  <>
                    <rect
                      x={childX}
                      y={childY - childHeight/2}
                      width={childWidth}
                      height={childHeight}
                      rx="18"
                      className="fill-green-600 cursor-pointer hover:opacity-80 transition-all duration-500 ease-in-out"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleNode(child.id);
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                    />
                    {childLines.map((line, index) => (
                      <text
                        key={index}
                        x={childX + childWidth/2}
                        y={childY - childHeight/2 + 20 + (index * 16)}
                        textAnchor="middle"
                        className="fill-white text-sm font-semibold pointer-events-none"
                      >
                        {line}
                      </text>
                    ))}
                  </>
                );
              })()}
              {/* Expand indicator - positioned outside on the right */}
              {child.children.length > 0 && (
                <circle
                  cx={childX + childWidth + 15}
                  cy={childY}
                  r="10"
                  className="fill-green-500 cursor-pointer hover:fill-green-400 transition-all duration-500 ease-in-out"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleNode(child.id);
                  }}
                />
              )}
              {child.children.length > 0 && (
                <text
                  x={childX + childWidth + 15}
                  y={childY + 3}
                  textAnchor="middle"
                  className="fill-white text-xs font-bold pointer-events-none transition-all duration-500 ease-in-out"
                >
                  {expandedNodes.has(child.id) ? '−' : '+'}
                </text>
              )}
              
              {/* Sub-branches */}
              {expandedNodes.has(child.id) && child.children.map((subChild, subIndex) => {
                const subHorizontalOffset = 380;
                
                // Calculate space for sub-nodes including their children
                const calculateSubRequiredSpace = (node: MindMapNode): number => {
                  if (!expandedNodes.has(node.id) || node.children.length === 0) return 80;
                  return Math.max(80, node.children.length * 60);
                };
                
                const subSpaces = child.children.map(calculateSubRequiredSpace);
                const totalSubSpace = subSpaces.reduce((sum, space) => sum + space, 0);
                
                let subCumulativeY = childY - totalSubSpace / 2;
                for (let i = 0; i < subIndex; i++) {
                  subCumulativeY += subSpaces[i];
                }
                
                const subX = childX + childWidth + subHorizontalOffset;
                const subY = subCumulativeY + subSpaces[subIndex] / 2;
                const subWidth = Math.max(subChild.title.length * 6 + 25, 170);
                
                return (
                  <g key={subChild.id}>
                    {/* Sub connection from expand button */}
                    <line
                      x1={childX + childWidth + 15}
                      y1={childY}
                      x2={subX}
                      y2={subY}
                      stroke="#64748b"
                      strokeWidth="2"
                      className="opacity-50 transition-all duration-500 ease-in-out"
                    />
                    
                    {/* Sub node */}
                    {(() => {
                      const subLines = wrapText(subChild.title, subWidth - 30);
                      const subHeight = Math.max(35, subLines.length * 14 + 16);
                      return (
                        <>
                          <rect
                            x={subX}
                            y={subY - subHeight/2}
                            width={subWidth}
                            height={subHeight}
                            rx="15"
                            className="fill-purple-500 cursor-pointer hover:opacity-80 transition-all duration-500 ease-in-out"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleNode(subChild.id);
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                          />
                          {subLines.map((line, index) => (
                            <text
                              key={index}
                              x={subX + subWidth/2}
                              y={subY - subHeight/2 + 16 + (index * 14)}
                              textAnchor="middle"
                              className="fill-white text-xs font-medium pointer-events-none"
                            >
                              {line}
                            </text>
                          ))}
                        </>
                      );
                    })()}
                    {/* Sub expand indicator - positioned outside on the right */}
                    {subChild.children.length > 0 && (
                      <circle
                        cx={subX + subWidth + 12}
                        cy={subY}
                        r="8"
                        className="fill-purple-400 cursor-pointer hover:fill-purple-300 transition-all duration-500 ease-in-out"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleNode(subChild.id);
                        }}
                      />
                    )}
                    {subChild.children.length > 0 && (
                      <text
                        x={subX + subWidth + 12}
                        y={subY + 2}
                        textAnchor="middle"
                        className="fill-white text-xs font-bold pointer-events-none transition-all duration-500 ease-in-out"
                      >
                        {expandedNodes.has(subChild.id) ? '−' : '+'}
                      </text>
                    )}
                    
                    {/* Third level nodes */}
                    {expandedNodes.has(subChild.id) && subChild.children.map((thirdChild, thirdIndex) => {
                      const thirdHorizontalOffset = 350;
                      const thirdSpacing = 50;
                      
                      const totalThirdHeight = (subChild.children.length - 1) * thirdSpacing;
                      const thirdStartY = subY - totalThirdHeight / 2;
                      
                      const thirdX = subX + subWidth + thirdHorizontalOffset;
                      const thirdY = thirdStartY + (thirdIndex * thirdSpacing);
                      const thirdWidth = Math.max(thirdChild.title.length * 6 + 25, 160);
                      
                      return (
                        <g key={thirdChild.id}>
                          {/* Third level connection from expand button */}
                          <line
                            x1={subX + subWidth + 12}
                            y1={subY}
                            x2={thirdX}
                            y2={thirdY}
                            stroke="#64748b"
                            strokeWidth="1.5"
                            className="opacity-40 transition-all duration-500 ease-in-out"
                          />
                          
                          {/* Third level node */}
                          {(() => {
                            const thirdLines = wrapText(thirdChild.title, thirdWidth - 25);
                            const thirdHeight = Math.max(30, thirdLines.length * 12 + 14);
                            return (
                              <>
                                <rect
                                  x={thirdX}
                                  y={thirdY - thirdHeight/2}
                                  width={thirdWidth}
                                  height={thirdHeight}
                                  rx="12"
                                  className="fill-pink-500 cursor-pointer hover:opacity-80 transition-all duration-300 transform scale-100"
                                />
                                {thirdLines.map((line, index) => (
                                  <text
                                    key={index}
                                    x={thirdX + thirdWidth/2}
                                    y={thirdY - thirdHeight/2 + 14 + (index * 12)}
                                    textAnchor="middle"
                                    className="fill-white text-xs font-medium pointer-events-none"
                                  >
                                    {line}
                                  </text>
                                ))}
                              </>
                            );
                          })()}
                        </g>
                      );
                    })}
                  </g>
                );
              })}
            </g>
          );
        })}
      </g>
    );
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.3));
  const handleResetZoom = () => { setZoom(0.8); setPan({ x: 0, y: 0 }); };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const MindMapContent = () => (
    <>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Mind Map</h3>
        <div className="flex gap-2">
          <button
            onClick={handleZoomOut}
            className="px-3 py-1 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 rounded text-gray-900 dark:text-white text-sm"
          >
            −
          </button>
          <button
            onClick={handleResetZoom}
            className="px-3 py-1 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 rounded text-gray-900 dark:text-white text-xs"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            onClick={handleZoomIn}
            className="px-3 py-1 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 rounded text-gray-900 dark:text-white text-sm"
          >
            +
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 rounded-lg text-gray-900 dark:text-white transition-colors"
          >
            {isFullscreen ? <FiMinimize size={16} /> : <FiMaximize size={16} />}
          </button>
        </div>
      </div>
      <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
        <svg
          width="100%"
          height={isFullscreen ? "calc(100vh - 160px)" : "800px"}
          viewBox="0 0 1800 1200"
          className={`w-full transition-all duration-300 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          style={{ userSelect: 'none' }}
          onWheel={(e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            setZoom(prev => Math.max(0.3, Math.min(2, prev + delta)));
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onContextMenu={(e) => e.preventDefault()}
        >
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`} className="transition-transform duration-200">
            {renderMindMap()}
          </g>
        </svg>
      </div>
    </>
  );

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-slate-400 mb-2">Generating mind map...</p>
          <p className="text-gray-500 dark:text-slate-500 text-sm">
            {content && content.trim() && !content.includes('Unable to extract') && !content.includes('extraction failed') && !content.includes('processing failed') && !content.includes('Please provide the text')
              ? 'Processing your content to create a comprehensive mind map'
              : content.includes('Unable to extract') || content.includes('extraction failed') || content.includes('processing failed') || content.includes('Please provide the text')
              ? 'PDF text extraction failed. Please upload text-based PDFs, DOCX files, or paste the text content directly.'
              : 'No content available for mind map generation. Please upload documents first.'
            }
          </p>
        </div>
      </div>
    );
  }

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-800 p-8">
        <MindMapContent />
      </div>
    );
  }

  return (
    <div className="p-8 bg-slate-800 rounded-lg overflow-auto">
      <MindMapContent />
    </div>
  );
}