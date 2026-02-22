'use client';

import { useState } from 'react';
import { Mail, X, Zap } from 'lucide-react';

interface LeadCaptureModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function LeadCaptureModal({ isOpen, onClose }: LeadCaptureModalProps) {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;
        // Store to localStorage as a demo
        const existing = JSON.parse(localStorage.getItem('cryptolens_leads') || '[]');
        existing.push({ email, subscribedAt: new Date().toISOString() });
        localStorage.setItem('cryptolens_leads', JSON.stringify(existing));
        setSubmitted(true);
    };

    return (
        <div className="lead-modal-backdrop" onClick={onClose}>
            <div className="lead-modal" onClick={(e) => e.stopPropagation()}>
                <button className="lead-modal-close" onClick={onClose}>
                    <X size={20} />
                </button>
                {!submitted ? (
                    <>
                        <div className="lead-modal-icon">
                            <Zap size={32} />
                        </div>
                        <h2 className="lead-modal-title">
                            Overnight Intelligence Briefing
                        </h2>
                        <p className="lead-modal-desc">
                            Wake up smarter. Get the top crypto signals, market movers, and
                            our cynically honest analysis delivered before you finish your
                            first coffee.
                        </p>
                        <form className="lead-modal-form" onSubmit={handleSubmit}>
                            <div className="lead-modal-input-wrap">
                                <Mail size={18} className="lead-modal-input-icon" />
                                <input
                                    type="email"
                                    placeholder="your@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="lead-modal-input"
                                    required
                                />
                            </div>
                            <button type="submit" className="lead-modal-submit">
                                Subscribe — It&apos;s Free
                            </button>
                        </form>
                        <p className="lead-modal-fine-print">
                            No spam. No shilling. Just data. Unsubscribe anytime.
                        </p>
                    </>
                ) : (
                    <div className="lead-modal-success">
                        <div className="lead-modal-icon lead-modal-icon--success">✓</div>
                        <h2 className="lead-modal-title">You&apos;re In.</h2>
                        <p className="lead-modal-desc">
                            Welcome to the briefing. We&apos;ll be in your inbox before the
                            market opens. Stay sharp.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

export function LeadCaptureBanner() {
    const [showModal, setShowModal] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    if (dismissed) return null;

    return (
        <>
            <div className="lead-banner animate-fade-in-up">
                <div className="lead-banner-content">
                    <div className="lead-banner-text">
                        <Zap size={20} className="lead-banner-icon" />
                        <div>
                            <strong>Overnight Intelligence Briefing</strong>
                            <span>Get the signals before everyone else.</span>
                        </div>
                    </div>
                    <div className="lead-banner-actions">
                        <button
                            className="lead-banner-cta"
                            onClick={() => setShowModal(true)}
                        >
                            Subscribe Free
                        </button>
                        <button
                            className="lead-banner-dismiss"
                            onClick={() => setDismissed(true)}
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
            </div>
            <LeadCaptureModal isOpen={showModal} onClose={() => setShowModal(false)} />
        </>
    );
}
