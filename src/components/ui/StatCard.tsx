import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: ReactNode;
  className?: string;
}

const StatCard = ({ title, value, change, changeType = 'neutral', icon, className = '' }: StatCardProps) => {
  const getChangeColor = () => {
    switch (changeType) {
      case 'positive':
        return 'text-success';
      case 'negative':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className={`card-pixel ${className}`}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="font-mono text-sm text-muted-foreground uppercase tracking-wider">
            {title}
          </p>
          <p className="text-2xl font-bold font-mono text-gradient-primary">
            {value}
          </p>
          {change && (
            <p className={`font-mono text-xs ${getChangeColor()}`}>
              {change}
            </p>
          )}
        </div>
        {icon && (
          <div className="text-primary/60">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;