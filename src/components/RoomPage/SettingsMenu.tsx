// src/components/RoomPage/SettingsMenu.tsx
"use client";
import { useState, useRef, useEffect } from "react";
import { Settings, Grid, Users } from "lucide-react";
import { useVideoLayoutStore } from "@/stores/useVideoLayoutStore";

interface SettingsMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
}

export default function SettingsMenu({
  isOpen,
  onClose,
  onOpen,
}: SettingsMenuProps) {
  const [activeTab, setActiveTab] = useState<"appearance" | "preferences">(
    "appearance"
  );
  const menuRef = useRef<HTMLDivElement>(null);
  const layout = useVideoLayoutStore((state) => state.layout);
  const setLayout = useVideoLayoutStore((state) => state.setLayout);
  const maxTilesPerRow = useVideoLayoutStore((state) => state.maxTilesPerRow);
  const setMaxTilesPerRow = useVideoLayoutStore(
    (state) => state.setMaxTilesPerRow
  );
  const isSpeakerHighlightEnabled = useVideoLayoutStore(
    (state) => state.isSpeakerHighlightEnabled
  );
  const setIsSpeakerHighlightEnabled = useVideoLayoutStore(
    (state) => state.setIsSpeakerHighlightEnabled
  );

  // Закрываем меню при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Закрываем меню при нажатии Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  return (
    <div className="relative">
      <button
        onClick={isOpen ? onClose : onOpen}
        className="p-2 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 shadow-md"
        title="Settings"
      >
        <Settings size={20} />
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50"
        >
          {/* Заголовок меню */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              Settings
            </h3>
          </div>

          {/* Вкладки */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              className={`flex-1 py-3 px-4 text-center font-medium ${
                activeTab === "appearance"
                  ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-500"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
              onClick={() => setActiveTab("appearance")}
            >
              Appearance
            </button>
            <button
              className={`flex-1 py-3 px-4 text-center font-medium ${
                activeTab === "preferences"
                  ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-500"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
              onClick={() => setActiveTab("preferences")}
            >
              Preferences
            </button>
          </div>

          {/* Содержимое вкладок */}
          <div className="p-4 max-h-96 overflow-y-auto">
            {activeTab === "appearance" && (
              <div>
                <h4 className="text-md font-medium text-gray-800 dark:text-white mb-3">
                  Video Layout
                </h4>
                <div className="space-y-3">
                  <div
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      layout === "grid"
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                    onClick={() => setLayout("grid")}
                  >
                    <div className="flex items-center">
                      <Grid
                        size={20}
                        className="text-gray-600 dark:text-gray-400 mr-2"
                      />
                      <span className="font-medium text-gray-800 dark:text-white">
                        Grid View
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      All participants in equal-sized tiles
                    </p>
                  </div>

                  <div
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      layout === "spotlight"
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                    onClick={() => setLayout("spotlight")}
                  >
                    <div className="flex items-center">
                      <Users
                        size={20}
                        className="text-gray-600 dark:text-gray-400 mr-2"
                      />
                      <span className="font-medium text-gray-800 dark:text-white">
                        Spotlight View
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Focus on active speaker with thumbnails
                    </p>
                  </div>

                  <div
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      layout === "test-grid"
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                    onClick={() => setLayout("test-grid")}
                  >
                    <div className="flex items-center">
                      <Grid
                        size={20}
                        className="text-gray-600 dark:text-gray-400 mr-2"
                      />
                      <span className="font-medium text-gray-800 dark:text-white">
                        Test Grid View
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Single tile for testing layout
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "preferences" && (
              <div>
                <h4 className="text-md font-medium text-gray-800 dark:text-white mb-4">
                  Preferences
                </h4>
                <div className="space-y-5">
                  {/* Max Tiles Per Row */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Max Tiles Per Row
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="6"
                      value={maxTilesPerRow}
                      onChange={(e) =>
                        setMaxTilesPerRow(Number(e.target.value))
                      }
                      className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Highlight Active Speaker */}
                  <div className="pt-1">
                    <label className="flex items-left gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSpeakerHighlightEnabled}
                        onChange={(e) =>
                          setIsSpeakerHighlightEnabled(e.target.checked)
                        }
                        className="mt-0.5 h-4 w-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300 dark:border-gray-600"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Highlight active speaker
                        </span>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          Show a green border around the person who is speaking
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Кнопка закрытия */}
          <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}