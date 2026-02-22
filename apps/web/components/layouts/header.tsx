import { Menu } from "lucide-react";

type HeaderProps = {
  onMenuClick: () => void;
};

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="bg-blue-600 text-white">
      <div className="flex h-14 items-center gap-4 px-6">
        <button
          type="button"
          aria-label="メニュー"
          onClick={onMenuClick}
          className="text-white hover:text-blue-100 transition-colors"
        >
          <Menu className="h-6 w-6" />
        </button>
        <span className="text-lg font-bold">ToDoアプリケーション</span>
      </div>
    </header>
  );
}
