'use client';
import { useState, useMemo } from 'react';
import { FiChevronDown, FiChevronRight, FiCircle } from 'react-icons/fi';

interface MindMapNode {
  id: string;
  title: string;
  children: MindMapNode[];
  level: number;
}

interface MindMapViewerProps {
  content: string;
}

// Define color constants outside component to avoid recreation
const NODE_COLORS = [
  'text-blue-600 dark:text-blue-400',
  'text-green-600 dark:text-green-400', 
  'text-purple-600 dark:text-purple-400',
  'text-orange-600 dark:text-orange-400',
  'text-red-600 dark:text-red-400'
];

const BG_COLORS = [
  'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700',
  'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700',
  'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700', 
  'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700',
  'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
];

export default function MindMapViewer({ content }: MindMapViewerProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  
  // Validate content prop
  if (!content || typeof content !== 'string') {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <p>No content available for mind map</p>
      </div>
    );
  }

  const parseContent = (text: string): MindMapNode[] => {
    const lines = text.split('\n').filter(line => line.trim());
    const nodes: MindMapNode[] = [];
    const stack: MindMapNode[] = [];

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      let level = 0;
      let title = trimmed;

      // Determine level based on markdown headers or indentation
      if (trimmed.startsWith('###')) {
        level = 3;
        title = trimmed.replace(/^###\s*/, '');
      } else if (trimmed.startsWith('##')) {
        level = 2;
        title = trimmed.replace(/^##\s*/, '');
      } else if (trimmed.startsWith('#')) {
        level = 1;
        title = trimmed.replace(/^#\s*/, '');
      } else if (trimmed.startsWith('- ')) {
        level = 4;
        title = trimmed.replace(/^-\s*/, '');
      } else {
        // Count leading spaces for indentation
        const leadingSpaces = line.length - line.trimStart().length;
        level = Math.floor(leadingSpaces / 2) + 1;
      }

      const node: MindMapNode = {
        id: `node-${index}`,
        title,
        children: [],
        level
      };

      // Find parent node
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

    return nodes;
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

  const renderNode = (node: MindMapNode, depth: number = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children.length > 0;
    
    const colors = [
      'text-blue-600 dark:text-blue-400',
      'text-green-600 dark:text-green-400', 
      'text-purple-600 dark:text-purple-400',
      'text-orange-600 dark:text-orange-400',
      'text-red-600 dark:text-red-400'
    ];

    const bgColors = [
      'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700',
      'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700',
      'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700', 
      'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700',
      'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
    ];

    const colorIndex = depth % colors.length;

    return (
      <div key={node.id} className={`ml-${depth * 4}`}>
        <div 
          className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer hover:shadow-md transition-all ${bgColors[colorIndex]} ${hasChildren ? 'cursor-pointer' : ''}`}
          onClick={() => hasChildren && toggleNode(node.id)}
        >
          {hasChildren ? (
            isExpanded ? (
              <FiChevronDown className={`w-4 h-4 ${colors[colorIndex]}`} />
            ) : (
              <FiChevronRight className={`w-4 h-4 ${colors[colorIndex]}`} />
            )
          ) : (
            <FiCircle className={`w-3 h-3 ${colors[colorIndex]}`} />
          )}
          <span className={`font-medium ${colors[colorIndex]}`}>
            {node.title}
          </span>
        </div>
        
        {hasChildren && isExpanded && (
          <div className="mt-2 ml-4 space-y-2">
            {node.children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const nodes = parseContent(content);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          Click nodes to expand/collapse • Colors indicate hierarchy levels
        </span>
      </div>
      
      {nodes.map(node => renderNode(node, 0))}
    </div>
  );
}