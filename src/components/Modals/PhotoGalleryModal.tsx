import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../lib/supabase';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import {
    X,
    Folder,
    ChevronRight,
    ChevronLeft,
    ArrowLeft,
    Download,
    Check,
    Loader2,
    Image as ImageIcon,
    CheckSquare,
    Square,
    Search
} from 'lucide-react';

interface ImageData {
    id: string;
    url_imagem: string;
    creditos: string | null;
    created_at: string;
    especie: {
        nome_cientifico: string;
    } | null;
}

interface GroupedImages {
    [speciesName: string]: ImageData[];
}

interface PhotoGalleryModalProps {
    isOpen: boolean;
    onClose: () => void;
    localId: string | number;
}

export function PhotoGalleryModal({ isOpen, onClose, localId }: PhotoGalleryModalProps) {
    const [loading, setLoading] = useState(true);
    const [images, setImages] = useState<ImageData[]>([]);
    const [groupedImages, setGroupedImages] = useState<GroupedImages>({});

    // Navigation state
    const [currentFolder, setCurrentFolder] = useState<string | null>(null);

    // Selection state
    const [selectedFolders, setSelectedFolders] = useState<Set<string>>(new Set());
    const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());

    // Download state
    const [downloading, setDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState('');

    // Search state
    const [searchTerm, setSearchTerm] = useState('');

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8; // 4 columns x 2 rows

    useEffect(() => {
        if (isOpen && localId) {
            fetchImages();
        }
    }, [isOpen, localId]);

    // Reset state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setCurrentFolder(null);
            setSelectedFolders(new Set());
            setSelectedImages(new Set());
            setSearchTerm('');
            setCurrentPage(1);
        }
    }, [isOpen]);

    // Reset page when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const fetchImages = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('imagens')
                .select('id, url_imagem, creditos, created_at, especie:especie_id(nome_cientifico)')
                .eq('local_id', localId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Normalize data: Supabase may return especie as array due to relation syntax
            const imageList: ImageData[] = (data || []).map((item: any) => ({
                id: item.id,
                url_imagem: item.url_imagem,
                creditos: item.creditos,
                created_at: item.created_at,
                especie: Array.isArray(item.especie) ? item.especie[0] || null : item.especie
            }));
            setImages(imageList);

            // Group by species name
            const grouped: GroupedImages = {};
            imageList.forEach(img => {
                const speciesName = img.especie?.nome_cientifico || 'Sem Espécie';
                if (!grouped[speciesName]) {
                    grouped[speciesName] = [];
                }
                grouped[speciesName].push(img);
            });
            setGroupedImages(grouped);
        } catch (err) {
            console.error('Error fetching images:', err);
        } finally {
            setLoading(false);
        }
    };

    // Filtered and paginated folder names
    const allFolderNames = Object.keys(groupedImages).sort();
    const filteredFolderNames = allFolderNames.filter(name =>
        name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const totalPages = Math.ceil(filteredFolderNames.length / itemsPerPage);
    const paginatedFolderNames = filteredFolderNames.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Selection handlers
    const toggleFolderSelection = (folderName: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newSelected = new Set(selectedFolders);
        if (newSelected.has(folderName)) {
            newSelected.delete(folderName);
        } else {
            newSelected.add(folderName);
        }
        setSelectedFolders(newSelected);
    };

    const toggleImageSelection = (imageId: string) => {
        const newSelected = new Set(selectedImages);
        if (newSelected.has(imageId)) {
            newSelected.delete(imageId);
        } else {
            newSelected.add(imageId);
        }
        setSelectedImages(newSelected);
    };

    const selectAllInFolder = () => {
        if (!currentFolder) return;
        const folderImages = groupedImages[currentFolder] || [];
        const allIds = folderImages.map(img => img.id);
        const allSelected = allIds.every(id => selectedImages.has(id));

        if (allSelected) {
            const newSelected = new Set(selectedImages);
            allIds.forEach(id => newSelected.delete(id));
            setSelectedImages(newSelected);
        } else {
            const newSelected = new Set(selectedImages);
            allIds.forEach(id => newSelected.add(id));
            setSelectedImages(newSelected);
        }
    };

    // Calculate total selected count
    const getTotalSelectedCount = () => {
        let count = selectedImages.size;
        selectedFolders.forEach(folderName => {
            count += groupedImages[folderName]?.length || 0;
        });
        return count;
    };

    // Download with JSZip
    const handleDownload = async () => {
        setDownloading(true);
        setDownloadProgress('Preparando download...');

        try {
            const zip = new JSZip();
            let processedCount = 0;

            // Collect all images to download
            const imagesToDownload: { url: string; folder: string; name: string }[] = [];

            // Add images from selected folders
            selectedFolders.forEach(folderName => {
                const folderImages = groupedImages[folderName] || [];
                folderImages.forEach((img, idx) => {
                    const ext = img.url_imagem.split('.').pop()?.split('?')[0] || 'jpg';
                    imagesToDownload.push({
                        url: img.url_imagem,
                        folder: folderName.replace(/[^a-zA-Z0-9\s]/g, '').trim(),
                        name: `foto_${idx + 1}.${ext}`
                    });
                });
            });

            // Add individually selected images
            selectedImages.forEach(imageId => {
                const img = images.find(i => i.id === imageId);
                if (img) {
                    const speciesName = (img.especie?.nome_cientifico || 'Sem_Especie').replace(/[^a-zA-Z0-9\s]/g, '').trim();
                    const ext = img.url_imagem.split('.').pop()?.split('?')[0] || 'jpg';
                    imagesToDownload.push({
                        url: img.url_imagem,
                        folder: '', // No folder for individual images
                        name: `${speciesName}_${imageId.slice(0, 6)}.${ext}`
                    });
                }
            });

            if (imagesToDownload.length === 0) {
                alert('Nenhuma imagem selecionada para download.');
                setDownloading(false);
                return;
            }

            const totalImages = imagesToDownload.length;

            // Fetch and add images to zip
            for (const item of imagesToDownload) {
                try {
                    setDownloadProgress(`Baixando ${processedCount + 1} de ${totalImages}...`);

                    const response = await fetch(item.url);
                    if (!response.ok) {
                        console.warn(`Failed to fetch: ${item.url}`);
                        continue;
                    }

                    const blob = await response.blob();

                    if (item.folder) {
                        // Add to folder
                        zip.folder(item.folder)?.file(item.name, blob);
                    } else {
                        // Add to root
                        zip.file(item.name, blob);
                    }

                    processedCount++;
                } catch (err) {
                    console.warn(`Error fetching image: ${item.url}`, err);
                }
            }

            if (processedCount === 0) {
                alert('Nenhuma imagem pôde ser baixada. Verifique sua conexão.');
                setDownloading(false);
                return;
            }

            setDownloadProgress('Gerando arquivo ZIP...');

            // Generate and download ZIP
            const content = await zip.generateAsync({ type: 'blob' });
            const timestamp = new Date().toISOString().slice(0, 10);
            saveAs(content, `veridia_imagens_${timestamp}.zip`);

            // Clear selection after successful download
            setSelectedFolders(new Set());
            setSelectedImages(new Set());
        } catch (err) {
            console.error('Download error:', err);
            alert('Erro ao gerar arquivo ZIP. Tente novamente.');
        } finally {
            setDownloading(false);
            setDownloadProgress('');
        }
    };

    if (!isOpen) return null;

    const currentFolderImages = currentFolder ? groupedImages[currentFolder] || [] : [];
    const totalSelected = getTotalSelectedCount();

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col animate-fade-in-up">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        {currentFolder ? (
                            <>
                                <button
                                    onClick={() => setCurrentFolder(null)}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <ArrowLeft size={20} className="text-gray-600" />
                                </button>
                                <div className="flex items-center gap-2 text-sm">
                                    <button
                                        onClick={() => setCurrentFolder(null)}
                                        className="text-gray-500 hover:text-gray-700"
                                    >
                                        Galeria
                                    </button>
                                    <ChevronRight size={16} className="text-gray-400" />
                                    <span className="font-medium text-gray-800 italic">{currentFolder}</span>
                                </div>
                            </>
                        ) : (
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <ImageIcon size={24} className="text-purple-600" />
                                    Galeria de Fotos
                                </h2>
                                <p className="text-sm text-gray-500">{images.length} imagens em {allFolderNames.length} espécies</p>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Search Bar (only in folder view) */}
                {!currentFolder && !loading && images.length > 0 && (
                    <div className="px-6 py-3 border-b border-gray-100 bg-white">
                        <div className="relative">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar espécie..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all text-sm"
                            />
                        </div>
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="animate-spin text-purple-600 mb-4" size={40} />
                            <p className="text-gray-500">Carregando imagens...</p>
                        </div>
                    ) : images.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <ImageIcon size={32} className="text-gray-300" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">Nenhuma imagem encontrada</h3>
                            <p className="text-gray-500 max-w-sm">
                                As imagens adicionadas às espécies do seu projeto aparecerão aqui.
                            </p>
                        </div>
                    ) : currentFolder ? (
                        /* Level 2: Images Grid */
                        <>
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-sm text-gray-600">{currentFolderImages.length} foto(s)</p>
                                <button
                                    onClick={selectAllInFolder}
                                    className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                                >
                                    {currentFolderImages.every(img => selectedImages.has(img.id))
                                        ? 'Desmarcar todas'
                                        : 'Selecionar todas'}
                                </button>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {currentFolderImages.map((img) => (
                                    <div
                                        key={img.id}
                                        onClick={() => toggleImageSelection(img.id)}
                                        className={`relative group cursor-pointer rounded-xl overflow-hidden border-2 transition-all ${selectedImages.has(img.id)
                                                ? 'border-purple-500 ring-2 ring-purple-200'
                                                : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <div className="aspect-square bg-gray-100">
                                            <img
                                                src={img.url_imagem}
                                                alt="Foto"
                                                className="w-full h-full object-cover"
                                                loading="lazy"
                                            />
                                        </div>
                                        {/* Selection Checkbox */}
                                        <div
                                            className={`absolute top-2 left-2 w-6 h-6 rounded-md flex items-center justify-center transition-all ${selectedImages.has(img.id)
                                                    ? 'bg-purple-500 text-white'
                                                    : 'bg-white/80 text-gray-400 opacity-0 group-hover:opacity-100'
                                                }`}
                                        >
                                            {selectedImages.has(img.id) ? <Check size={16} /> : <Square size={16} />}
                                        </div>
                                        {/* Credits */}
                                        {img.creditos && (
                                            <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-black/60 text-white text-xs truncate">
                                                📷 {img.creditos}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : filteredFolderNames.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <Search size={32} className="text-gray-300 mb-4" />
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">Nenhum resultado</h3>
                            <p className="text-gray-500">Nenhuma espécie corresponde à sua busca.</p>
                        </div>
                    ) : (
                        /* Level 1: Folders Grid (4 columns, paginated) */
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {paginatedFolderNames.map((folderName) => {
                                const folderImages = groupedImages[folderName];
                                const isSelected = selectedFolders.has(folderName);
                                const coverImage = folderImages[0]?.url_imagem;

                                return (
                                    <div
                                        key={folderName}
                                        onClick={() => setCurrentFolder(folderName)}
                                        className={`relative group cursor-pointer rounded-xl overflow-hidden border-2 transition-all hover:shadow-lg ${isSelected
                                                ? 'border-purple-500 ring-2 ring-purple-200'
                                                : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        {/* Folder Preview */}
                                        <div className="aspect-square bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center relative">
                                            {coverImage ? (
                                                <img
                                                    src={coverImage}
                                                    alt={folderName}
                                                    className="absolute inset-0 w-full h-full object-cover opacity-30"
                                                    loading="lazy"
                                                />
                                            ) : null}
                                            <Folder size={48} className="text-amber-500 relative z-10" />
                                        </div>

                                        {/* Folder Info */}
                                        <div className="p-3 bg-white">
                                            <h4 className="font-medium text-gray-800 truncate italic text-sm" title={folderName}>
                                                {folderName}
                                            </h4>
                                            <p className="text-xs text-gray-500">{folderImages.length} foto(s)</p>
                                        </div>

                                        {/* Selection Checkbox */}
                                        <div
                                            onClick={(e) => toggleFolderSelection(folderName, e)}
                                            className={`absolute top-2 left-2 w-7 h-7 rounded-md flex items-center justify-center transition-all cursor-pointer ${isSelected
                                                    ? 'bg-purple-500 text-white'
                                                    : 'bg-white/90 text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-purple-100 hover:text-purple-600'
                                                }`}
                                        >
                                            {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Pagination Footer (only in folder view with results) */}
                {!currentFolder && !loading && filteredFolderNames.length > itemsPerPage && (
                    <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft size={16} />
                            Anterior
                        </button>

                        <span className="text-sm text-gray-500">
                            Página {currentPage} de {totalPages}
                        </span>

                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Próximo
                            <ChevronRight size={16} />
                        </button>
                    </div>
                )}

                {/* Download Action Bar */}
                {totalSelected > 0 && (
                    <div className="px-6 py-4 border-t border-gray-100 bg-purple-50 flex items-center justify-between">
                        <p className="text-sm text-purple-700 font-medium">
                            {totalSelected} {totalSelected === 1 ? 'item selecionado' : 'itens selecionados'}
                        </p>
                        <button
                            onClick={handleDownload}
                            disabled={downloading}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 min-w-[180px] justify-center"
                        >
                            {downloading ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    <span className="text-sm">{downloadProgress || 'Processando...'}</span>
                                </>
                            ) : (
                                <>
                                    <Download size={18} />
                                    Baixar ZIP
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
}
