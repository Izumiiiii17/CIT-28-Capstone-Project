import { HTMLAttributes, useState } from 'react';
import { motion } from "framer-motion";

// CardProps interface for all subcomponents
interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

// Main Card
export default function Card({ children, className = '', ...props }: CardProps) {
  return (
    <motion.div
      role="region"
      aria-label="Card"
      className={`relative bg-white rounded-xl shadow-lg border border-gray-200 p-6 transition-shadow duration-300 ${className}`}
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{
        y: -6,
        boxShadow: "0 12px 32px -8px rgba(16,185,129,0.16), 0 4px 8px -2px rgba(0,0,0,0.08)"
      }}
      transition={{ duration: 0.34, ease: [0.25, 0.1, 0.25, 1.0] }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// CardHeader with animated gradient line on parent hover
export function CardHeader({ children, className = '', ...props }: CardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`mb-4 relative ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    >
      {children}
      <motion.div
        className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-emerald-400 via-blue-400 to-blue-600 rounded-full"
        initial={{ width: 0 }}
        animate={{ width: isHovered ? "100%" : "36%" }}
        transition={{ duration: 0.4 }}
        style={{ position: 'absolute', bottom: -2 }}
      />
    </div>
  );
}

// CardTitle with fade-in/slide animation
export function CardTitle({ children, className = '', ...props }: CardProps) {
  return (
    <motion.h3
      className={`text-lg font-semibold text-gray-900 ${className}`}
      initial={{ x: -14, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.31, ease: [0.25, 0.1, 0.25, 1.0] }}
      tabIndex={0}
      {...props}
    >
      {children}
    </motion.h3>
  );
}

// CardContent with gentle fade-in
export function CardContent({ children, className = '', ...props }: CardProps) {
  return (
    <motion.div
      className={`text-gray-600 ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.34, delay: 0.13, ease: [0.25, 0.1, 0.25, 1.0] }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
