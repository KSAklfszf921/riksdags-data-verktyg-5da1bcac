
import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

const ThemeToggle = () => {
  const { theme, setTheme, effectiveTheme } = useTheme();

  const getIcon = () => {
    if (theme === 'system') {
      return <Monitor className="h-4 w-4" />;
    }
    return effectiveTheme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />;
  };

  return (
    <Tooltip>
      <DropdownMenu>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              {getIcon()}
              <span className="sr-only">Växla tema</span>
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <DropdownMenuContent align="end" className="bg-white dark:bg-gray-800 border shadow-lg">
          <DropdownMenuItem 
            onClick={() => setTheme('light')}
            className="flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Sun className="h-4 w-4" />
            <span>Ljust</span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => setTheme('dark')}
            className="flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Moon className="h-4 w-4" />
            <span>Mörkt</span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => setTheme('system')}
            className="flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Monitor className="h-4 w-4" />
            <span>System</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <TooltipContent>
        <p>Växla mellan ljust och mörkt tema</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default ThemeToggle;
