import React from 'react';
import Editor, { EditorProps, OnChange, OnMount } from '@monaco-editor/react';
import { Loader2 } from 'lucide-react';

interface CodeEditorProps {
  language?: string;
  value?: string;
  onChange?: OnChange;
  readOnly?: boolean;
  theme?: string;
  height?: string | number;
  onMount?: OnMount;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  language = 'javascript',
  value = '',
  onChange,
  readOnly = false,
  theme = 'vs-dark', // Default dark theme like LeetCode
  height = '100%', // Default to full height of container
  onMount
}) => {
  const editorOptions: EditorProps['options'] = {
    readOnly: readOnly,
    fontSize: 14,
    minimap: { enabled: true },
    scrollBeyondLastLine: false,
    automaticLayout: true, // Adjust layout on container resize
    wordWrap: 'on', // Enable word wrapping
    padding: {
      top: 10,
      bottom: 10
    }
  };

  return (
    <Editor
      height={height}
      language={language}
      theme={theme}
      value={value}
      options={editorOptions}
      onChange={onChange}
      onMount={onMount}
      loading={<Loader2 className="h-6 w-6 animate-spin mx-auto mt-4" />} // Show spinner while loading
    />
  );
};

export default CodeEditor;
