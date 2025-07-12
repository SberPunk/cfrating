import { ChannelWithTags } from "@shared/schema";
import { Star, Users } from "lucide-react";

interface ChannelCardProps {
  channel: ChannelWithTags;
  onClick: () => void;
}

export function ChannelCard({ channel, onClick }: ChannelCardProps) {
  const getChannelIcon = (name: string) => {
    const firstChar = name.charAt(0).toLowerCase();
    if (firstChar.includes('tech') || firstChar.includes('тех')) return '💻';
    if (firstChar.includes('crypto') || firstChar.includes('крипт')) return '💰';
    if (firstChar.includes('news') || firstChar.includes('новост')) return '📰';
    if (firstChar.includes('meme') || firstChar.includes('мем')) return '😂';
    return '📢';
  };

  return (
    <div
      className="channel-card"
      onClick={onClick}
    >
      <div className="flex items-start space-x-3">
        <div className="w-12 h-12 bg-[hsl(205,100%,40%)] rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-xl">{getChannelIcon(channel.name)}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <h4 className="font-medium text-white truncate">{channel.name}</h4>
            <div className="flex items-center space-x-1">
              <Star className="w-3 h-3 text-yellow-400 fill-current" />
              <span className="text-xs text-gray-400">
                {channel.averageRating ? Number(channel.averageRating).toFixed(1) : "0.0"}
              </span>
            </div>
          </div>
          <p className="text-sm text-gray-400 mb-2 line-clamp-2">
            {channel.description || "Описание не указано"}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex space-x-1 flex-wrap">
              {channel.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag.id}
                  className="px-2 py-1 bg-[hsl(0,0%,18%)] rounded-full text-xs"
                >
                  {tag.name}
                </span>
              ))}
              {channel.tags.length > 2 && (
                <span className="px-2 py-1 bg-[hsl(0,0%,18%)] rounded-full text-xs">
                  +{channel.tags.length - 2}
                </span>
              )}
            </div>
            <div className="flex items-center text-xs text-gray-500">
              <Users className="w-3 h-3 mr-1" />
              {channel.subscriberCount || 0}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
