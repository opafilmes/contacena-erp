import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function ModuleCard({ icon, title, to, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link to={to}>
        <div className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-md p-8 h-52 flex flex-col items-center justify-center gap-4 transition-all duration-500 hover:border-primary/30 hover:bg-white/[0.07] hover:shadow-[0_8px_40px_-12px_hsl(var(--primary)/0.25)] cursor-pointer">
          {/* Glow effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-primary/10 via-transparent to-accent/5 pointer-events-none" />
          
          {/* Floating orb */}
          <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-primary/5 blur-3xl group-hover:bg-primary/10 transition-all duration-700 pointer-events-none" />

          <div className="relative z-10 text-4xl mb-1 group-hover:scale-110 transition-transform duration-500">
            {icon}
          </div>
          <div className="relative z-10 text-center">
            {title.split("\n").map((line, i) => (
              <p
                key={i}
                className={
                  i === 0
                    ? "font-heading font-semibold text-foreground text-base tracking-wide"
                    : "text-muted-foreground text-xs mt-1"
                }
              >
                {line}
              </p>
            ))}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}