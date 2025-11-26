import { Link } from 'react-router-dom';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin, ArrowUp, Heart } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Footer() {
  const [isVisible, setIsVisible] = useState(false);
  const year = new Date().getFullYear();

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Animation variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.1, 0.25, 1.0]
      }
    }
  };

  const socialIconVariants: Variants = {
    hover: {
      scale: 1.2,
      rotate: 5,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10
      }
    }
  };

  const linkVariants: Variants = {
    hover: {
      x: 5,
      color: "#10b981",
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10
      }
    }
  };

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-900/20 rounded-full mix-blend-multiply filter blur-xl"
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-900/20 rounded-full mix-blend-multiply filter blur-xl"
          animate={{
            x: [0, -100, 0],
            y: [0, 100, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
        >
          {/* Brand */}
          <motion.div className="space-y-4" variants={itemVariants}>
            <motion.div 
              className="flex items-center space-x-2"
              whileHover={{ scale: 1.05 }}
            >
              <motion.div
                className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-lg flex items-center justify-center shadow-lg"
                whileHover={{ 
                  scale: 1.1, 
                  rotate: 5,
                  boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)"
                }}
              >
                <span className="text-white font-bold text-sm">NG</span>
              </motion.div>
              <span className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">NutriGuide</span>
            </motion.div>
            <p className="text-gray-300 text-sm leading-relaxed">
              Empowering healthier lives through AI-powered nutrition and fitness planning,
              aligned with UN SDGs for Zero Hunger and Good Health.
            </p>
            <div className="flex space-x-4">
              {[
                { icon: Facebook, label: "Facebook" },
                { icon: Twitter, label: "Twitter" },
                { icon: Instagram, label: "Instagram" },
                { icon: Linkedin, label: "LinkedIn" }
              ].map(({ icon: Icon, label }) => (
                <motion.div
                  key={label}
                  variants={socialIconVariants}
                  whileHover="hover"
                  whileTap={{ scale: 0.9 }}
                >
                  <Icon className="w-5 h-5 text-gray-400 hover:text-emerald-400 cursor-pointer transition-colors" />
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div variants={itemVariants}>
            <h3 className="font-semibold text-lg mb-4 flex items-center">
              Quick Links
              <motion.div
                className="ml-2 w-6 h-0.5 bg-emerald-400"
                initial={{ width: 0 }}
                whileInView={{ width: 24 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              />
            </h3>
            <ul className="space-y-2 text-sm">
              {[
                { name: "Home", href: "/" },
                { name: "Demo", href: "/demo" },
                { name: "About", href: "/about" },
                { name: "Contact", href: "/contact" },
                { name: "Sign In", href: "/auth" }
              ].map(({ name, href }) => (
                <motion.li key={name} variants={itemVariants}>
                  <motion.div
                    variants={linkVariants}
                    whileHover="hover"
                  >
                    <Link 
                      to={href} 
                      className="text-gray-300 hover:text-emerald-400 transition-colors flex items-center group"
                    >
                      <span className="transform transition-transform group-hover:translate-x-1">
                        {name}
                      </span>
                    </Link>
                  </motion.div>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Features */}
          <motion.div variants={itemVariants}>
            <h3 className="font-semibold text-lg mb-4 flex items-center">
              Features
              <motion.div
                className="ml-2 w-6 h-0.5 bg-emerald-400"
                initial={{ width: 0 }}
                whileInView={{ width: 24 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              />
            </h3>
            <ul className="space-y-2 text-sm">
              {[
                "AI Meal Planning",
                "TDEE Calculator",
                "Exercise Recommendations",
                "Nutrition Tracking",
                "Goal Management"
              ].map((feature, index) => (
                <motion.li 
                  key={feature} 
                  className="text-gray-300 flex items-center group"
                  variants={itemVariants}
                  whileHover={{ x: 5, color: "#10b981" }}
                >
                  <motion.span
                    className="mr-2"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ delay: 0.1 * index }}
                  >
                    →
                  </motion.span>
                  {feature}
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Contact Info */}
          <motion.div variants={itemVariants}>
            <h3 className="font-semibold text-lg mb-4 flex items-center">
              Contact
              <motion.div
                className="ml-2 w-6 h-0.5 bg-emerald-400"
                initial={{ width: 0 }}
                whileInView={{ width: 24 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              />
            </h3>
            <ul className="space-y-3 text-sm">
              {[
                { icon: Mail, text: "syedzane18@gmail.com" },
                { icon: Phone, text: "+91 9876543210" },
                { icon: MapPin, text: "Presidency University Bangalore" }
              ].map(({ icon: Icon, text }) => (
                <motion.li 
                  key={text}
                  className="flex items-center space-x-2"
                  variants={itemVariants}
                  whileHover={{ x: 5 }}
                >
                  <motion.div
                    whileHover={{ scale: 1.2, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <Icon className="w-4 h-4 text-emerald-400" />
                  </motion.div>
                  <span className="text-gray-300">{text}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </motion.div>

        <motion.div
          className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <p className="text-gray-400 text-sm flex items-center">
            © {year} NutriGuide. All rights reserved.
            <motion.div
              className="ml-2"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Heart className="w-4 h-4 text-red-500 fill-current" />
            </motion.div>
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            {[
              { name: "Privacy Policy", href: "/privacy" },
              { name: "Terms of Service", href: "/terms" }
            ].map(({ name, href }) => (
              <motion.div
                key={name}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link 
                  to={href} 
                  className="text-gray-400 hover:text-emerald-400 text-sm transition-colors flex items-center"
                >
                  {name}
                  <motion.div
                    className="ml-1 w-0 h-0 bg-emerald-400"
                    initial={{ width: 0 }}
                    whileHover={{ width: 8 }}
                    transition={{ duration: 0.3 }}
                  />
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Scroll to top button */}
      <AnimatePresence>
        {isVisible && (
          <motion.button
            onClick={scrollToTop}
            aria-label="Scroll to top"
            className="fixed bottom-8 right-8 bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-full shadow-lg z-50"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <ArrowUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </footer>
  );
}