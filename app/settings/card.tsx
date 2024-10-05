import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';

interface SettingCardProps {
  icon: JSX.Element;
  title: string;
  description?: string;
  children?: React.ReactNode; // Make children optional by adding ?
}

export const SettingCard = ({
  icon,
  title,
  description,
  children
}: SettingCardProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-4">
        <div className="flex flex-grow flex-row items-center gap-4">
          {icon}
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
        </div>
        {children && <div style={{ width: '65%' }}>{children}</div>}
      </CardHeader>
    </Card>
  );
};
