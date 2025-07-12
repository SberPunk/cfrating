import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Glassmorphism } from "@/components/ui/glassmorphism";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-5">
      <Glassmorphism className="w-full max-w-sm">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Настройки</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="w-8 h-8 p-0 rounded-full hover:bg-white/10"
            >
              <X className="w-4 h-4 text-gray-400" />
            </Button>
          </div>

          <div className="text-center text-gray-400">
            <p>Настройки пока не доступны</p>
          </div>
        </div>
      </Glassmorphism>
    </div>
  );
}
