import React, { useState, useRef, useEffect } from 'react';
import { Camera, Link, Check, Sparkles, UserPlus, Loader2 } from 'lucide-react';
import { GalleryItem, GalleryInvite } from '../types';
import { ImageModal } from '../components/ImageModal';
import { useTheme } from '../contexts/ThemeContext';
import {
  uploadPhoto,
  addGalleryItem,
  subscribeToGallery,
  createInvite,
  getInvite,
  deleteInvite,
} from '../services/galleryService';

export const GalleryPage: React.FC = () => {
  const { theme } = useTheme();
  const dark = theme === 'dark';

  // ── Gallery state (real-time from Firestore) ────────────────────────────
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(true);

  // ── Form state ──────────────────────────────────────────────────────────
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // ── Invite state ────────────────────────────────────────────────────────
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [activeInvite, setActiveInvite] = useState<GalleryInvite | null>(null);
  const [copied, setCopied] = useState(false);

  // ── Camera refs & state ──────────────────────────────────────────────────
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  // ── Subscribe to Firestore gallery_items in real-time ───────────────────
  useEffect(() => {
    const unsubscribe = subscribeToGallery((items) => {
      setGalleryItems(items);
      setGalleryLoading(false);
    });
    return unsubscribe;
  }, []);

  // ── Resolve invite from URL query-param (Firestore-backed) ─────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let inviteId = params.get('invite');

    if (!inviteId && window.location.hash.includes('?')) {
      const hashQuery = window.location.hash.split('?')[1];
      const hashParams = new URLSearchParams(hashQuery);
      inviteId = hashParams.get('invite');
    }

    if (inviteId) {
      getInvite(inviteId).then((invite) => {
        if (invite) {
          setActiveInvite(invite);
        }
      });
    }
  }, []);

  // ── Clean up camera stream on unmount ──────────────────────────────────
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // ── Camera helpers ─────────────────────────────────────────────────────

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => { });
      }
      setIsCameraActive(true);
    } catch (err) {
      console.error('Camera access error:', err);
      alert('Camera access denied or unavailable. Please allow camera permissions in your browser.');
    }
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const width = video.videoWidth || 640;
      const height = video.videoHeight || 480;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setCapturedPhoto(dataUrl);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
        setIsCameraActive(false);
      }
    }
  };

  // ── Add single photo or complete invite ────────────────────────────────

  const handleAddPhoto = async () => {
    if (!name.trim()) {
      alert('Please enter your name');
      return;
    }
    if (!capturedPhoto) {
      alert('Please take a photo first');
      return;
    }

    setSubmitting(true);
    try {
      const downloadUrl = await uploadPhoto(capturedPhoto);

      if (activeInvite) {
        await addGalleryItem({
          type: 'invite',
          inviter: activeInvite.inviter,
          invitee: {
            name: name.trim(),
            message: message.trim(),
            photoUrl: downloadUrl,
          },
        });
        await deleteInvite(activeInvite.id);
        setActiveInvite(null);
        window.history.replaceState({}, document.title, window.location.pathname);
      } else {
        await addGalleryItem({
          type: 'single',
          name: name.trim(),
          message: message.trim(),
          photoUrl: downloadUrl,
        });
      }

      setName('');
      setMessage('');
      setCapturedPhoto(null);
    } catch (err: any) {
      console.error('Failed to save photo:', err);
      alert(`Could not save photo: ${err?.message || 'Please check your connection and Firestore rules.'}`);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Create invite link ──────────────────────────────────────────────────

  const handleCreateInvite = async () => {
    if (!name.trim()) {
      alert('Please enter your name to create an invite link');
      return;
    }
    if (!capturedPhoto) {
      alert('Please take your photo first to create an invite');
      return;
    }

    setSubmitting(true);
    try {
      const downloadUrl = await uploadPhoto(capturedPhoto);
      const inviteId = await createInvite({
        name: name.trim(),
        message: message.trim(),
        photoUrl: downloadUrl,
      });

      const url = `${window.location.origin}/#/gallery?invite=${inviteId}`;
      setInviteLink(url);
      setName('');
      setMessage('');
      setCapturedPhoto(null);
    } catch (err: any) {
      console.error('Failed to create invite:', err);
      alert(`Could not create invite: ${err?.message || 'Please check your Firestore rules.'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const copyInviteLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────

  const panelBg     = dark ? '#000000' : '#ffffff';
  const panelBorder = dark ? '#27272a' : '#e2e8f0';
  const inputBg     = dark ? '#18181b' : '#faf8f5';
  const inputBorder = dark ? '#3f3f46' : '#cbd5e1';
  const inputText   = dark ? '#ffffff' : '#172554';
  const mutedText   = dark ? '#a1a1aa' : '#475569';
  const headingColor= dark ? '#ffffff' : '#172554';

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* LEFT COLUMN: Add & Invite Section */}
        <div
          className="lg:col-span-4 rounded-2xl p-6 h-fit border transition-colors duration-300 shadow-sm"
          style={{ background: panelBg, borderColor: panelBorder }}
        >
          <h2 className="font-serif text-2xl sm:text-3xl font-normal mb-4 tracking-tight" style={{ color: headingColor }}>
            {activeInvite ? `Responding to ${activeInvite.inviter.name}'s Invite` : 'Add your image'}
          </h2>

          {activeInvite && (
            <div
              className="p-3 rounded-lg text-sm mb-4 font-bold"
              style={{
                background: dark ? '#18181b' : '#fef08a',
                border: `1px solid ${dark ? '#3f3f46' : '#fde047'}`,
                color: dark ? '#ffffff' : '#172554',
              }}
            >
              Responding to invite from <strong>{activeInvite.inviter.name}</strong>. Snap your picture to join them in a single grid card!
            </div>
          )}

          {/* Camera Viewfinder Box */}
          <div
            className="relative rounded-xl overflow-hidden aspect-video border mb-4 flex items-center justify-center"
            style={{ background: dark ? '#000000' : '#faf8f5', borderColor: panelBorder }}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${isCameraActive ? 'block' : 'hidden'}`}
            />

            {capturedPhoto && (
              <img
                src={capturedPhoto}
                alt="Captured"
                className="w-full h-full object-cover absolute inset-0 z-10"
              />
            )}

            {!isCameraActive && !capturedPhoto && (
              <button
                type="button"
                onClick={startCamera}
                className="font-bold px-5 py-2.5 rounded-lg flex items-center gap-2 transition shadow-sm z-10"
                style={{
                  background: dark ? '#27272a' : '#fef08a',
                  color: dark ? '#ffffff' : '#172554',
                  border: dark ? '1px solid #3f3f46' : '1px solid #fde047',
                }}
              >
                <Camera className="h-5 w-5" style={{ color: dark ? '#ffffff' : '#172554' }} /> Open Camera
              </button>
            )}
          </div>

          <canvas ref={canvasRef} className="hidden" />

          {isCameraActive && !capturedPhoto && (
            <button
              onClick={takePhoto}
              className="w-full font-bold py-2 rounded-lg mb-4 flex items-center justify-center gap-2 transition shadow-sm"
              style={{
                background: dark ? '#27272a' : '#fef08a',
                color: dark ? '#ffffff' : '#172554',
                border: dark ? '1px solid #3f3f46' : '1px solid #fde047',
              }}
            >
              <Camera className="h-4 w-4" /> Click Pic
            </button>
          )}

          {capturedPhoto && (
            <button
              onClick={() => setCapturedPhoto(null)}
              className="w-full py-2 rounded-lg mb-4 text-sm font-bold transition"
              style={{
                background: dark ? '#000000' : '#faf8f5',
                color: dark ? '#ffffff' : inputText,
                border: `1px solid ${panelBorder}`,
              }}
            >
              Retake Pic
            </button>
          )}

          <div className="space-y-3 mb-6">
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-yellow-300 transition font-medium text-sm"
              style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: inputText }}
            />
            <input
              type="text"
              placeholder="Message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-yellow-300 transition font-medium text-sm"
              style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: inputText }}
            />
          </div>

          <div className="space-y-3">
            <button
              onClick={handleAddPhoto}
              disabled={submitting}
              className="w-full font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-50 shadow-sm text-sm"
              style={{
                background: dark ? '#27272a' : '#fef08a',
                color: dark ? '#ffffff' : '#172554',
                border: dark ? '1px solid #3f3f46' : '1px solid #fde047',
              }}
            >
              {submitting && <Loader2 className="h-5 w-5 animate-spin" />}
              {submitting ? 'Adding…' : 'Add your image'}
            </button>

            {!activeInvite && (
              <button
                onClick={handleCreateInvite}
                disabled={submitting}
                className="w-full font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 transition text-sm disabled:opacity-50 shadow-sm"
                style={{
                  background: dark ? '#000000' : '#faf8f5',
                  color: dark ? '#ffffff' : '#172554',
                  border: `1px solid ${dark ? '#3f3f46' : '#cbd5e1'}`,
                }}
              >
                <Link className="h-4 w-4" style={{ color: dark ? '#ffffff' : '#172554' }} /> Create Invite Link
              </button>
            )}
          </div>

          {inviteLink && (
            <div
              className="mt-4 p-3 rounded-xl space-y-2"
              style={{
                background: dark ? '#000000' : '#faf8f5',
                border: `1px solid ${dark ? '#3f3f46' : '#cbd5e1'}`,
              }}
            >
              <p className="text-xs font-bold" style={{ color: dark ? '#ffffff' : '#172554' }}>
                Invite Link Generated
              </p>
              <input
                type="text"
                readOnly
                value={inviteLink}
                className="w-full text-xs p-2 rounded font-mono font-medium"
                style={{
                  background: dark ? '#18181b' : '#ffffff',
                  color: dark ? '#ffffff' : '#172554',
                  border: `1px solid ${dark ? '#27272a' : '#e2e8f0'}`,
                }}
              />
              <button
                onClick={copyInviteLink}
                className="w-full text-xs py-1.5 rounded flex items-center justify-center gap-1 font-bold transition shadow-sm"
                style={{
                  background: dark ? '#27272a' : '#fef08a',
                  color: dark ? '#ffffff' : '#172554',
                  border: dark ? '1px solid #3f3f46' : '1px solid #fde047',
                }}
              >
                {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Link className="h-3 w-3" />}
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Gallery Grid */}
        <div className="lg:col-span-8">
          <h2 className="font-serif text-3xl sm:text-4xl font-normal mb-6 tracking-tight" style={{ color: headingColor }}>Gallery</h2>

          {galleryLoading ? (
            <div
              className="flex items-center justify-center py-16 rounded-2xl border"
              style={{ background: panelBg, borderColor: panelBorder }}
            >
              <Loader2 className="h-8 w-8 animate-spin" style={{ color: dark ? '#ffffff' : '#172554' }} />
            </div>
          ) : galleryItems.length === 0 ? (
            <div
              className="text-center py-16 rounded-2xl border font-medium"
              style={{ background: panelBg, borderColor: panelBorder }}
            >
              <p style={{ color: mutedText }}>The gallery is currently empty. Use the Add section to submit photos.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {galleryItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className="rounded-xl overflow-hidden transition cursor-pointer group flex flex-col border shadow-sm"
                  style={{
                    background: panelBg,
                    borderColor: panelBorder,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = dark ? '#ffffff' : '#172554';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = panelBorder;
                  }}
                >
                  {item.type === 'single' ? (
                    <>
                      <div className="aspect-square overflow-hidden" style={{ background: dark ? '#000000' : '#faf8f5' }}>
                        <img
                          src={item.photoUrl}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      </div>
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <h3 className="font-bold transition" style={{ color: headingColor }}>{item.name}</h3>
                        <p className="text-sm mt-1 line-clamp-2 font-medium" style={{ color: mutedText }}>"{item.message}"</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-0.5 aspect-square overflow-hidden" style={{ background: dark ? '#000000' : '#faf8f5' }}>
                        <img
                          src={item.inviter.photoUrl}
                          alt={item.inviter.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                        <img
                          src={item.invitee.photoUrl}
                          alt={item.invitee.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      </div>
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <h3 className="font-bold transition text-sm" style={{ color: headingColor }}>
                          {item.inviter.name} & {item.invitee.name}
                        </h3>
                        <p className="text-xs mt-1 line-clamp-2 font-medium" style={{ color: mutedText }}>
                          {item.inviter.message} | {item.invitee.message}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {selectedItem && (
        <ImageModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </div>
  );
};