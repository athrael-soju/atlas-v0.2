import React from 'react';
import { motion } from 'framer-motion';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';

export const TooltipButton = ({
  onClick,
  icon,
  tooltipText,
  active = false
}: {
  onClick: () => void;
  icon: React.ReactNode;
  tooltipText: string;
  active?: boolean;
}) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <motion.button
        onClick={onClick}
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.05 }}
        className="rounded-full p-2 focus:outline-none"
        style={{ color: active ? '#f97316' : 'inherit' }}
        type="button"
      >
        {icon}
      </motion.button>
    </TooltipTrigger>
    <TooltipContent side="top">{tooltipText}</TooltipContent>
  </Tooltip>
);
