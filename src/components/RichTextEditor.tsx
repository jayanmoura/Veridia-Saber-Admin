import { useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, Heading2, Heading3, List, ImageIcon } from 'lucide-react';
import { uploadFile } from '../utils/storage';
import { useToast } from '../hooks/useToast';

interface RichTextEditorProps {
    content: string;
    onChange: (html: string) => void;
    placeholder?: string;
    orgao: string;
}

export default function RichTextEditor({ content, onChange, placeholder, orgao }: RichTextEditorProps) {
    const { showToast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Image.configure({
                inline: true,
                allowBase64: true,
            }),
            Placeholder.configure({
                placeholder: placeholder || 'Escreva o conteúdo aqui...',
            }),
        ],
        content: content,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'min-h-[300px] p-3 focus:outline-none prose max-w-none',
            },
        },
    });

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            // higieniza o nome do arquivo, removendo espaços e caracteres especiais problemáticos
            const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            const fileName = `${orgao}/conteudo_${Date.now()}_${cleanFileName}`;

            const url = await uploadFile('imagens_conteudo', fileName, file);

            if (url && editor) {
                editor.chain().focus().setImage({ src: url }).run();
            }
        } catch (err: any) {
            console.error('Erro no upload de imagem:', err);
            showToast('Erro ao fazer upload da imagem: ' + err.message, 'error');
        } finally {
            if (fileInputRef.current) {
                fileInputRef.current.value = ''; // resets input
            }
        }
    };

    if (!editor) {
        return null;
    }

    return (
        <div className="border border-gray-300 rounded-lg overflow-hidden bg-white flex flex-col">
            <style>{`
                .ProseMirror {
                    color: #374151; /* gray-700 */
                }
                .ProseMirror > *:first-child {
                    margin-top: 0 !important;
                }
                .ProseMirror h2 {
                    font-size: 1.5rem;
                    font-weight: 700;
                    margin-top: 1.5rem;
                    margin-bottom: 0.75rem;
                    color: #111827;
                }
                .ProseMirror h3 {
                    font-size: 1.25rem;
                    font-weight: 600;
                    margin-top: 1.25rem;
                    margin-bottom: 0.5rem;
                    color: #1f2937;
                }
                .ProseMirror p {
                    margin-bottom: 1rem;
                    line-height: 1.6;
                }
                .ProseMirror p:last-child {
                    margin-bottom: 0;
                }
                .ProseMirror strong {
                    font-weight: 700;
                    color: #111827;
                }
                .ProseMirror em {
                    font-style: italic;
                }
                .ProseMirror ul {
                    list-style-type: disc;
                    padding-left: 1.5rem;
                    margin-bottom: 1rem;
                }
                .ProseMirror ul li {
                    margin-bottom: 0.25rem;
                }
                .ProseMirror img {
                    max-width: 100%;
                    height: auto;
                    border-radius: 0.5rem;
                    margin-top: 1rem;
                    margin-bottom: 1rem;
                }
                .ProseMirror p.is-editor-empty:first-child::before {
                    color: #9ca3af;
                    content: attr(data-placeholder);
                    float: left;
                    height: 0;
                    pointer-events: none;
                }
            `}</style>
            <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-300 bg-gray-50">
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${editor.isActive('bold') ? 'bg-gray-200 text-gray-900' : 'text-gray-600'}`}
                    title="Negrito"
                >
                    <Bold size={18} />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${editor.isActive('italic') ? 'bg-gray-200 text-gray-900' : 'text-gray-600'}`}
                    title="Itálico"
                >
                    <Italic size={18} />
                </button>
                <div className="w-px h-6 bg-gray-300 mx-1"></div>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={`p-1.5 rounded hover:bg-gray-200 transition-colors font-bold text-sm ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-200 text-gray-900' : 'text-gray-600'}`}
                    title="Título 2"
                >
                    <Heading2 size={18} />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    className={`p-1.5 rounded hover:bg-gray-200 transition-colors font-bold text-sm ${editor.isActive('heading', { level: 3 }) ? 'bg-gray-200 text-gray-900' : 'text-gray-600'}`}
                    title="Título 3"
                >
                    <Heading3 size={18} />
                </button>
                <div className="w-px h-6 bg-gray-300 mx-1"></div>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${editor.isActive('bulletList') ? 'bg-gray-200 text-gray-900' : 'text-gray-600'}`}
                    title="Lista não-ordenada"
                >
                    <List size={18} />
                </button>
                <div className="w-px h-6 bg-gray-300 mx-1"></div>
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-1.5 rounded hover:bg-gray-200 transition-colors text-gray-600"
                    title="Inserir Imagem"
                >
                    <ImageIcon size={18} />
                </button>
                <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                />
            </div>
            <div className="flex-1 overflow-y-auto">
                <EditorContent editor={editor} />
            </div>
        </div>
    );
}
