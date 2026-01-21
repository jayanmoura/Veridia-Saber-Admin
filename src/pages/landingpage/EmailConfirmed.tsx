import React from 'react';
import { motion } from 'framer-motion';

/**
 * EmailConfirmed - Public landing page for email verification success
 * 
 * A visually rich, botanical-themed confirmation page with organic animations.
 * No redirects or navigation buttons - purely informational.
 */
const EmailConfirmed: React.FC = () => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 relative overflow-hidden">
            {/* Subtle botanical background pattern */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {/* Floating leaves pattern */}
                <motion.div
                    className="absolute -top-20 -left-20 w-64 h-64 opacity-[0.04]"
                    initial={{ rotate: 0 }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
                >
                    <svg viewBox="0 0 100 100" fill="currentColor" className="text-emerald-600 w-full h-full">
                        <path d="M50 0 C75 25 75 75 50 100 C25 75 25 25 50 0" />
                    </svg>
                </motion.div>
                <motion.div
                    className="absolute top-1/4 -right-16 w-48 h-48 opacity-[0.03]"
                    initial={{ rotate: 45 }}
                    animate={{ rotate: 405 }}
                    transition={{ duration: 100, repeat: Infinity, ease: "linear" }}
                >
                    <svg viewBox="0 0 100 100" fill="currentColor" className="text-green-500 w-full h-full">
                        <path d="M50 0 C75 25 75 75 50 100 C25 75 25 25 50 0" />
                    </svg>
                </motion.div>
                <motion.div
                    className="absolute bottom-1/4 -left-12 w-40 h-40 opacity-[0.03]"
                    initial={{ rotate: -30 }}
                    animate={{ rotate: 330 }}
                    transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
                >
                    <svg viewBox="0 0 100 100" fill="currentColor" className="text-teal-500 w-full h-full">
                        <path d="M50 0 C75 25 75 75 50 100 C25 75 25 25 50 0" />
                    </svg>
                </motion.div>
                <motion.div
                    className="absolute -bottom-24 right-1/4 w-72 h-72 opacity-[0.025]"
                    initial={{ rotate: 15 }}
                    animate={{ rotate: 375 }}
                    transition={{ duration: 150, repeat: Infinity, ease: "linear" }}
                >
                    <svg viewBox="0 0 100 100" fill="currentColor" className="text-emerald-700 w-full h-full">
                        <path d="M50 0 C75 25 75 75 50 100 C25 75 25 25 50 0" />
                    </svg>
                </motion.div>
            </div>

            {/* Main content */}
            <div className="relative z-10 flex flex-col items-center px-6 text-center max-w-lg">
                {/* Botanical Check Animation */}
                <BotanicalCheck />

                {/* Title - appears after icon animation */}
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 2.2, duration: 0.8, ease: "easeOut" }}
                    className="mt-8 text-3xl sm:text-4xl font-bold text-emerald-800 tracking-tight"
                >
                    Conta Verificada com Sucesso!
                </motion.h1>

                {/* Instruction message - appears after title */}
                <motion.p
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 2.6, duration: 0.8, ease: "easeOut" }}
                    className="mt-4 text-base sm:text-lg text-emerald-700/80 leading-relaxed"
                >
                    Sua jornada no <span className="font-semibold text-emerald-800">Veridia Saber</span> começa agora.
                    Por favor, <strong className="text-emerald-700">volte para o aplicativo</strong> e comece a explorar o aplicativo e catalogar suas coleções.
                </motion.p>

                {/* Decorative divider */}
                <motion.div
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={{ scaleX: 1, opacity: 1 }}
                    transition={{ delay: 3.0, duration: 0.6, ease: "easeOut" }}
                    className="mt-8 w-24 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent"
                />

                {/* Veridia Saber branding with logo */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 3.2, duration: 0.8 }}
                    className="mt-6 flex items-center gap-3 text-emerald-700"
                >
                    <img
                        src="/icon.png"
                        alt="Veridia Saber"
                        className="w-8 h-8 object-contain"
                    />
                    <span className="text-base font-semibold tracking-wide">Veridia Saber</span>
                </motion.div>
            </div>
        </div>
    );
};

/**
 * BotanicalCheck - Animated SVG check mark with botanical style
 */
const BotanicalCheck: React.FC = () => {
    return (
        <motion.div
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{
                delay: 0.2,
                duration: 1.2,
                type: "spring",
                stiffness: 100,
                damping: 12
            }}
            className="relative w-32 h-32 sm:w-40 sm:h-40"
        >
            {/* Glow effect behind the icon */}
            <motion.div
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.8, duration: 0.8 }}
                className="absolute inset-0 rounded-full bg-emerald-400/20 blur-2xl"
            />

            {/* Main SVG container */}
            <svg
                viewBox="0 0 100 100"
                className="w-full h-full drop-shadow-lg"
                style={{ overflow: 'visible' }}
            >
                {/* Background circle */}
                <motion.circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="url(#circleGradient)"
                    strokeWidth="3"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 1.2, ease: "easeInOut" }}
                />

                {/* The check mark */}
                <motion.path
                    d="M28 52 L42 66 L72 34"
                    fill="none"
                    stroke="url(#checkGradient)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 1.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                />

                {/* Small leaf decoration at the tip */}
                <motion.g
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                        delay: 1.8,
                        duration: 0.5,
                        type: "spring",
                        stiffness: 200
                    }}
                >
                    <motion.path
                        d="M72 34 Q80 27 87 31 Q84 39 76 37 Q74 35 72 34"
                        fill="url(#leafGradient)"
                        stroke="none"
                    />
                    {/* Leaf vein */}
                    <motion.path
                        d="M73 34.5 Q78 33 82 34"
                        fill="none"
                        stroke="#166534"
                        strokeWidth="0.8"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ delay: 2.1, duration: 0.3 }}
                    />
                </motion.g>

                {/* Gradient definitions */}
                <defs>
                    <linearGradient id="circleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#34d399" />
                        <stop offset="50%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#059669" />
                    </linearGradient>

                    <linearGradient id="checkGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#059669" />
                        <stop offset="50%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#34d399" />
                    </linearGradient>

                    <linearGradient id="leafGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#34d399" />
                        <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                </defs>
            </svg>

            {/* Sparkle particles that appear at the end */}
            {[...Array(6)].map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: [0, 1, 0], scale: [0, 1, 0.5] }}
                    transition={{
                        delay: 1.8 + i * 0.1,
                        duration: 0.8,
                        ease: "easeOut",
                    }}
                    className="absolute w-2 h-2 bg-emerald-400 rounded-full"
                    style={{
                        top: `${20 + Math.random() * 60}%`,
                        left: `${20 + Math.random() * 60}%`,
                    }}
                />
            ))}
        </motion.div>
    );
};

export default EmailConfirmed;
