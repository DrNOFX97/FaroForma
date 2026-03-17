import { useState } from 'react';
import { Upload, X } from 'lucide-react';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';

interface ImageUploaderProps {
  label: string;
  value: string;
  folder: string;
  onChange: (url: string) => void;
}

export function ImageUploader({ label, value, folder, onChange }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecione uma imagem.');
      e.target.value = '';
      return;
    }

    const MAX_MB = 5;
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`Imagem demasiado grande. Máximo ${MAX_MB}MB.`);
      e.target.value = '';
      return;
    }

    setUploading(true);
    const toastId = toast.loading('A carregar imagem...');
    try {
      const fileName = `${Date.now()}_${file.name}`;
      const url = await apiService.uploadFile(`${folder}/${fileName}`, file);
      onChange(url);
      toast.success('Imagem carregada!', { id: toastId });
    } catch (err) {
      toast.error('Erro ao carregar imagem.', { id: toastId });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="image-uploader">
      <label className="form__label">{label}</label>
      <div className="uploader-box glass">
        {value ? (
          <div className="preview-wrap">
            <img src={value} alt="Preview" className="image-preview" />
            <button className="remove-btn" onClick={() => onChange('')} title="Remover Imagem">
              <X size={14} />
            </button>
          </div>
        ) : (
          <label className="upload-placeholder">
            <input type="file" onChange={handleFileChange} accept="image/*" disabled={uploading} hidden />
            <Upload size={24} className={uploading ? 'animate-bounce' : ''} />
            <span>{uploading ? 'A carregar...' : 'Clique para carregar'}</span>
          </label>
        )}
      </div>
      <style>{`
        .image-uploader { display: flex; flex-direction: column; gap: 0.5rem; }
        .uploader-box { height: 160px; border-radius: var(--radius); overflow: hidden; display: flex; align-items: center; justify-content: center; position: relative; border: 1px dashed var(--border); transition: border-color 0.2s; }
        .uploader-box:hover { border-color: var(--accent); }
        
        .preview-wrap { width: 100%; height: 100%; position: relative; }
        .image-preview { width: 100%; height: 100%; object-fit: cover; }
        .remove-btn { position: absolute; top: 8px; right: 8px; width: 24px; height: 24px; border-radius: 50%; background: rgba(239, 68, 68, 0.9); color: white; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: transform 0.2s; }
        .remove-btn:hover { transform: scale(1.1); }

        .upload-placeholder { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.75rem; cursor: pointer; color: var(--text-muted); font-size: 0.85rem; font-weight: 600; }
        .upload-placeholder span { opacity: 0.7; }
        @keyframes animate-bounce-kf { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        .animate-bounce { animation: animate-bounce-kf 0.8s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
