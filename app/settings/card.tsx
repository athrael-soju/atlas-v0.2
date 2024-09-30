import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';

interface SettingCardProps {
  icon: JSX.Element;
  title: string;
  description: string;
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
        {icon}
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
      {children && <CardContent>{children}</CardContent>}
    </Card>
  );
};
