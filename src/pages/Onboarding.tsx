import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, QrCode, Bell, ChevronRight, Smartphone } from 'lucide-react';
import { useApp } from '../context/AppContext';

const steps = [
  {
    icon: Moon,
    title: 'Rise for Fajr',
    subtitle: 'بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ',
    subtitleTranslation: 'Allah in the name of, the Most Gracious, the Most Merciful',
    description: 'Never miss Fajr again. A smart alarm that ensures you truly wake up.',
    color: '#1B6B4A',
  },
  {
    icon: Bell,
    title: 'Smart Alarm',
    subtitle: 'Cannot be dismissed easily',
    subtitleTranslation: '',
    description: 'When the alarm rings, you must scan a QR code to stop it. No snooze, no cheating.',
    color: '#E04D5E',
  },
  {
    icon: QrCode,
    title: 'QR Code System',
    subtitle: 'Place it far from your bed',
    subtitleTranslation: '',
    description: 'Generate a unique QR code and place it near your bathroom. You must get up to scan it.',
    color: '#C4953A',
  },
  {
    icon: Smartphone,
    title: 'Install the App',
    subtitle: 'Works offline as a PWA',
    subtitleTranslation: '',
    description: 'Add this to your home screen for the best experience. Works even without internet.',
    color: '#2A9D6F',
  },
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const { setOnboardingComplete } = useApp();

  const current = steps[step];
  const Icon = current.icon;
  const isLast = step === steps.length - 1;

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background glow */}
      <motion.div
        key={step}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.2 }}
        style={{
          position: 'absolute',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: current.color,
          filter: 'blur(120px)',
          top: '20%',
        }}
      />

      {/* Step indicators */}
      <div style={{
        display: 'flex',
        gap: 8,
        marginBottom: 60,
        position: 'relative',
        zIndex: 1,
      }}>
        {steps.map((_, i) => (
          <motion.div
            key={i}
            animate={{
              width: i === step ? 32 : 8,
              background: i === step ? current.color : 'rgba(255,255,255,0.2)',
            }}
            style={{
              height: 8,
              borderRadius: 4,
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          />
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Icon circle */}
          <motion.div
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
            style={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${current.color}33, ${current.color}11)`,
              border: `2px solid ${current.color}44`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 40,
            }}
          >
            <Icon size={48} color={current.color} strokeWidth={1.5} />
          </motion.div>

          <h1 style={{
            fontSize: 32,
            fontWeight: 700,
            marginBottom: 8,
            letterSpacing: '-0.5px',
          }}>
            {current.title}
          </h1>

          <p className={step === 0 ? 'arabic-text' : ''} style={{
            fontSize: step === 0 ? 22 : 14,
            color: 'var(--text-secondary)',
            marginBottom: current.subtitleTranslation ? 6 : 16,
            fontWeight: step === 0 ? 400 : 500,
          }}>
            {current.subtitle}
          </p>

          {current.subtitleTranslation && (
            <p style={{
              fontSize: 12,
              color: 'var(--text-muted)',
              marginBottom: 16,
              fontStyle: 'italic',
            }}>
              {current.subtitleTranslation}
            </p>
          )}

          <p style={{
            fontSize: 16,
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            maxWidth: 320,
          }}>
            {current.description}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Action button */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => {
          if (isLast) {
            setOnboardingComplete();
          } else {
            setStep(s => s + 1);
          }
        }}
        style={{
          position: 'absolute',
          bottom: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          padding: '16px 40px',
          borderRadius: 16,
          background: `linear-gradient(135deg, ${current.color}, ${current.color}cc)`,
          color: 'white',
          fontSize: 16,
          fontWeight: 600,
          border: 'none',
          boxShadow: `0 4px 20px ${current.color}55`,
          cursor: 'pointer',
          zIndex: 1,
        }}
      >
        {isLast ? 'Get Started' : 'Continue'}
        <ChevronRight size={20} />
      </motion.button>

      {/* Skip button */}
      {!isLast && (
        <button
          onClick={setOnboardingComplete}
          style={{
            position: 'absolute',
            bottom: 24,
            background: 'none',
            color: 'var(--text-muted)',
            fontSize: 14,
            zIndex: 1,
          }}
        >
          Skip
        </button>
      )}
    </div>
  );
}
