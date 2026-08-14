import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { GalleryItem } from '../types';
import { useTheme } from '../contexts/ThemeContext';

interface ImageModalProps {
  item: GalleryItem;
  onClose: () => void;
}

export const ImageModal: React.FC<ImageModalProps> = ({ item, onClose }) => {
  const { theme } = useTheme();
  const dark = theme === 'dark';

  return (
    <div
      className="fixed inset-0 z-50 backdrop-blur-md flex flex-col justify-between p-4 sm:p-8"
      style={{ background: 'rgba(0,0,0,0.92)' }}
    >
      <div className="flex items-center justify-between">
        <button
          onClick={onClose}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg font-bold transition shadow-sm"
          style={{
            background: dark ? '#27272a' : '#fef08a',
            color: dark ? '#ffffff' : '#172554',
            border: dark ? '1px solid #3f3f46' : '1px solid #fde047',
          }}
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to gallery</span>
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center my-4 overflow-hidden">
        {item.type === 'single' ? (
          <img
            src={item.photoUrl}
            alt={item.name}
            className="max-h-[70vh] max-w-full object-contain rounded-lg border"
            style={{ borderColor: dark ? '#475569' : '#ffffff' }}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[70vh] max-w-4xl w-full">
            <div className="flex flex-col items-center">
              <img
                src={item.inviter.photoUrl}
                alt={item.inviter.name}
                className="max-h-[55vh] object-contain rounded-lg border"
                style={{ borderColor: dark ? '#475569' : '#ffffff' }}
              />
              <div className="text-center mt-2">
                <p className="font-bold text-white">{item.inviter.name}</p>
                <p className="text-sm font-medium text-slate-300">"{item.inviter.message}"</p>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <img
                src={item.invitee.photoUrl}
                alt={item.invitee.name}
                className="max-h-[55vh] object-contain rounded-lg border"
                style={{ borderColor: dark ? '#475569' : '#ffffff' }}
              />
              <div className="text-center mt-2">
                <p className="font-bold text-white">{item.invitee.name}</p>
                <p className="text-sm font-medium text-slate-300">"{item.invitee.message}"</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {item.type === 'single' && (
        <div
          className="text-center p-4 rounded-xl max-w-xl mx-auto w-full border"
          style={{
            background: dark ? '#0a1128' : '#ffffff',
            borderColor: dark ? '#475569' : '#e2e8f0',
          }}
        >
          <h3 className="text-2xl font-extrabold" style={{ color: dark ? '#ffffff' : '#172554' }}>
            {item.name}
          </h3>
          <p className="italic mt-1 font-medium" style={{ color: dark ? '#94a3b8' : '#475569' }}>
            "{item.message}"
          </p>
        </div>
      )}
    </div>
  );
};