export function CatMascot() {
  return (
    <div className="text-center mb-12">
      <div className="w-24 h-24 mx-auto mb-4 relative">
        <div className="w-full h-full bg-white/10 backdrop-blur-sm rounded-full border border-white/20 flex items-center justify-center">
          <div className="text-4xl">🐱</div>
        </div>
        <div className="absolute -top-1 -right-1 w-6 h-6 bg-[hsl(205,100%,40%)] rounded-full flex items-center justify-center">
          <svg
            className="w-3 h-3 text-white"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
        </div>
      </div>
      <p className="text-gray-400 text-sm max-w-xs mx-auto leading-relaxed">
        Найдите лучшие каналы Telegram<br />
        с помощью отзывов пользователей
      </p>
    </div>
  );
}
