import { useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { sql } from '@codemirror/lang-sql';
import { java } from '@codemirror/lang-java';
import { EditorView } from '@codemirror/view';
import { useProgress } from '@/store/progress';

export type EditorLang = 'ts' | 'sql' | 'java';

export default function CodeEditor({ value, onChange, lang, label, minHeight = '220px' }: { value: string; onChange: (v: string) => void; lang: EditorLang; label: string; minHeight?: string }) {
  const theme = useProgress((s) => s.settings.theme);
  const extensions = useMemo(
    () => [
      lang === 'sql' ? sql() : lang === 'java' ? java() : javascript({ typescript: true }),
      EditorView.lineWrapping,
      EditorView.contentAttributes.of({ 'aria-label': label }),
    ],
    [lang, label],
  );
  return (
    <div className="overflow-hidden rounded-lg border border-line">
      <CodeMirror
        value={value}
        onChange={onChange}
        extensions={extensions}
        theme={theme === 'dark' ? 'dark' : 'light'}
        minHeight={minHeight}
        basicSetup={{ lineNumbers: true, foldGutter: false, highlightActiveLine: true, autocompletion: true, tabSize: 2 }}
      />
    </div>
  );
}
