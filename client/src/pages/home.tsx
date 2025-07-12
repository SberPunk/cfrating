import { useState } from "react";
import { Search, Settings, Plus, Star, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AddChannelModal } from "@/components/add-channel-modal";
import { SettingsModal } from "@/components/settings-modal";
import { ChannelDetailModal } from "@/components/channel-detail-modal";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { ChannelWithTags, Tag } from "@shared/schema";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<ChannelWithTags | null>(null);
  const [showResults, setShowResults] = useState(false);

  const [, setLocation] = useLocation();

  const { data: channels = [] } = useQuery<ChannelWithTags[]>({
    queryKey: ["/api/channels", searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      
      const response = await fetch(`/api/channels?${params}`);
      if (!response.ok) throw new Error("Failed to fetch channels");
      return response.json();
    },
    enabled: showResults,
  });

  const handleSearch = () => {
    setShowResults(true);
  };

  const handleAdminLogin = () => {
    setLocation("/admin");
  };

  const handleChannelClick = (channel: ChannelWithTags) => {
    setSelectedChannel(channel);
  };



  const renderStars = (rating: number) => {
    const numRating = Number(rating);
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(numRating) 
            ? "fill-yellow-400 text-yellow-400" 
            : "text-gray-400"
        }`}
      />
    ));
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="relative z-10 flex justify-end items-center p-5 pt-12">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowSettingsModal(true)}
          className="w-6 h-6 p-0"
        >
          <Settings className="w-4 h-4 text-gray-400 hover:text-white" />
        </Button>
      </header>

      {/* Main Content */}
      <main className="relative z-10 px-5 pt-20 pb-20">
        {!showResults ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            {/* Search Section */}
            <div className="w-full max-w-sm space-y-4 mb-8">
              {/* Search Input */}
              <div className="relative">
                <div className="absolute inset-0 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20"></div>
                <div className="relative flex items-center">
                  <Search className="text-gray-400 absolute left-4 z-10 w-5 h-5" />
                  <Input
                    placeholder="Поиск каналов..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input pr-20"
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Button
                    onClick={handleSearch}
                    className="absolute right-2 top-2 h-8 px-3 bg-[hsl(205,100%,40%)] hover:bg-[hsl(205,100%,35%)] text-white text-sm"
                  >
                    Найти
                  </Button>
                </div>
              </div>



              {/* Add Channel Button */}
              <Button
                onClick={() => setShowAddModal(true)}
                className="w-full glass-button py-4 px-6 text-white hover:bg-white/20 transition-all duration-200 flex items-center justify-center space-x-3"
              >
                <Plus className="w-5 h-5" />
                <span className="font-medium">Добавить канал</span>
              </Button>

              {/* Admin Login Button */}
              <Button
                onClick={handleAdminLogin}
                className="w-full glass-button py-4 px-6 text-white hover:bg-white/20 transition-all duration-200 flex items-center justify-center space-x-3"
              >
                <span className="font-medium">Админ панель</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            {/* Search Header */}
            <div className="mb-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex-1 relative">
                  <div className="absolute inset-0 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20"></div>
                  <div className="relative flex items-center">
                    <Search className="text-gray-400 absolute left-4 z-10 w-5 h-5" />
                    <Input
                      placeholder="Поиск каналов..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="search-input pr-20"
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <Button
                      onClick={handleSearch}
                      className="absolute right-2 top-2 h-8 px-3 bg-[hsl(205,100%,40%)] hover:bg-[hsl(205,100%,35%)] text-white text-sm"
                    >
                      Найти
                    </Button>
                  </div>
                </div>
                <Button
                  onClick={() => setShowResults(false)}
                  variant="outline"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  Назад
                </Button>
              </div>


            </div>

            {/* Results */}
            <div className="space-y-4">
              {channels.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-400 text-lg">Каналы не найдены</p>
                  <p className="text-gray-500 text-sm mt-2">
                    Попробуйте изменить запрос или фильтры
                  </p>
                </div>
              ) : (
                channels.map((channel) => (
                  <Card 
                    key={channel.id} 
                    className="bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/15 transition-colors cursor-pointer"
                    onClick={() => handleChannelClick(channel)}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-white text-lg flex items-center space-x-2">
                            <span>{channel.name}</span>
                            <ExternalLink className="w-4 h-4 text-gray-400" />
                          </CardTitle>
                          <CardDescription className="text-gray-400">
                            {channel.subscriberCount.toLocaleString()} подписчиков
                          </CardDescription>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1">
                            {renderStars(channel.averageRating)}
                            <span className="text-sm text-gray-300 ml-1">
                              {Number(channel.averageRating).toFixed(1)}
                            </span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {channel.reviewCount} отзывов
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-300 mb-3">{channel.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {channel.tags.map((tag) => (
                          <Badge 
                            key={tag.id} 
                            variant="secondary"
                            className="text-xs bg-white/10 text-gray-300"
                          >
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center p-5 text-xs text-gray-500">
        <p>made by @adzuconf</p>
      </footer>

      {/* Modals */}
      <AddChannelModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
      />
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />
      <ChannelDetailModal
        channel={selectedChannel}
        onClose={() => setSelectedChannel(null)}
      />
    </div>
  );
}
