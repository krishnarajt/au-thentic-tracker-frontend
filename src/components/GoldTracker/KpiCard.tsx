import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCardProps } from "./types";

const KpiCard = ({ icon: Icon, iconColor = "text-gold/80", bgColor = "bg-gold/10", title, value, valueClass = "text-foreground", subtitle, delay = "0ms" }: KpiCardProps) => (
  <Card className="glass-card gold-border-glow overflow-hidden relative group" style={{ animationDelay: delay }}>
    <div className="absolute inset-0 bg-gradient-to-br from-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
    <CardHeader className="pb-2 relative">
      <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2 uppercase tracking-wider">
        <div className={`p-1.5 rounded-lg ${bgColor}`}>
          <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
        </div>
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="relative">
      <div className={`numeric-readable text-2xl font-bold font-inter tracking-tight ${valueClass}`}>{value}</div>
      {subtitle && <div className="text-xs text-muted-foreground mt-1">{subtitle}</div>}
    </CardContent>
  </Card>
);

export default KpiCard;
