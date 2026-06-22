import { NavLink } from 'react-router-dom';
import { LineChart, Briefcase, Newspaper, Zap, User } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function Navbar() {
  const navItems = [
    { name: 'Home', path: '/', icon: LineChart },
    { name: 'Portfolio', path: '/portfolio', icon: Briefcase },
    { name: 'News', path: '/news', icon: Newspaper },
    { name: 'Disruptors', path: '/disruptors', icon: Zap },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-surfaceHighlight bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-2 rounded-lg">
              <LineChart className="h-6 w-6 text-primary" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">InvestDash</span>
          </div>

          <div className="hidden md:flex items-center gap-1 text-sm font-medium">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2 px-4 py-2 rounded-md transition-colors",
                      isActive
                        ? "bg-primary text-white"
                        : "text-textMuted hover:bg-surfaceHighlight hover:text-white"
                    )
                  }
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </NavLink>
              );
            })}
          </div>

          <div className="flex items-center gap-4">
            {/* Placeholder for future auth */}
            <button className="flex items-center gap-2 text-sm font-medium text-textMuted hover:text-white transition-colors">
              <User className="h-5 w-5" />
              <span>Login</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
