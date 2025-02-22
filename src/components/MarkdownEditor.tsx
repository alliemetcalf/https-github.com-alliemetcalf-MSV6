import React from 'react';
import { Bold, Italic, List, ListOrdered, Type } from 'lucide-react';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

const FONT_FAMILIES = [
  { value: 'sans', label: 'Sans Serif' },
  { value: 'serif', label: 'Serif' },
  { value: 'mono', label: 'Monospace' }
];

const FONT_SIZES = [
  { value: 'sm', label: 'Small' },
  { value: 'base', label: 'Normal' },
  { value: 'lg', label: 'Large' },
  { value: 'xl', label: 'Extra Large' }
];

export default function MarkdownEditor({ value, onChange, placeholder, rows = 4 }: MarkdownEditorProps) {
  const insertMarkdown = (prefix: string, suffix: string = '') => {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    const beforeText = value.substring(0, start);
    const afterText = value.substring(end);
    
    const newText = `${beforeText}${prefix}${selectedText}${suffix}${afterText}`;
    onChange(newText);
    
    // Reset selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        end + prefix.length
      );
    }, 0);
  };

  const handleFontChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedText = getSelectedText();
    if (selectedText) {
      const fontClass = `font-${e.target.value}`;
      insertMarkdown(`<span class="${fontClass}">`, '</span>');
    }
  };

  const handleSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedText = getSelectedText();
    if (selectedText) {
      const sizeClass = `text-${e.target.value}`;
      insertMarkdown(`<span class="${sizeClass}">`, '</span>');
    }
  };

  const getSelectedText = () => {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    return value.substring(textarea.selectionStart, textarea.selectionEnd);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 bg-gray-50 p-2 rounded-t-md border border-gray-200">
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => insertMarkdown('**', '**')}
            className="p-1.5 hover:bg-gray-200 rounded transition"
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertMarkdown('*', '*')}
            className="p-1.5 hover:bg-gray-200 rounded transition"
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertMarkdown('\n- ')}
            className="p-1.5 hover:bg-gray-200 rounded transition"
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertMarkdown('\n1. ')}
            className="p-1.5 hover:bg-gray-200 rounded transition"
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center space-x-2 border-l border-gray-300 pl-2">
          <Type className="w-4 h-4 text-gray-500" />
          <select
            onChange={handleFontChange}
            className="text-sm border-gray-300 rounded-md focus:border-blue-500 focus:ring focus:ring-blue-200"
            defaultValue=""
          >
            <option value="" disabled>Font Family</option>
            {FONT_FAMILIES.map(font => (
              <option key={font.value} value={font.value}>
                {font.label}
              </option>
            ))}
          </select>
          <select
            onChange={handleSizeChange}
            className="text-sm border-gray-300 rounded-md focus:border-blue-500 focus:ring focus:ring-blue-200"
            defaultValue=""
          >
            <option value="" disabled>Font Size</option>
            {FONT_SIZES.map(size => (
              <option key={size.value} value={size.value}>
                {size.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="mt-1 block w-full rounded-b-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
      />
    </div>
  );
}
