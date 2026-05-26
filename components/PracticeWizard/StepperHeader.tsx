// components/PracticeWizard/StepperHeader.tsx
"use client";

import { motion } from "framer-motion";
import { STEPS, StepKey } from "../../hooks/usePracticeWizard";

interface Props {
  currentStep: StepKey;
}

export default function StepperHeader({ currentStep }: Props) {
  return (
    <div className="flex items-center gap-4 mb-6 overflow-x-auto">
      {STEPS.map((s, idx) => (
        <div key={s.key} className="flex items-center gap-1">
          <motion.div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${s.key === currentStep ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}
            whileHover={{ scale: 1.05 }}
          >
            {/* Icon placeholder – you can import actual icons if needed */}
            <span className="text-sm font-medium uppercase">{idx + 1}</span>
          </motion.div>
          <span className={`text-sm font-medium ${s.key === currentStep ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</span>
          {idx < STEPS.length - 1 && (
            <motion.div
              className="flex-1 h-0.5 bg-border/30 mx-2"
              layoutId="stepper-connector"
            />
          )}
        </div>
      ))}
    </div>
  );
}
