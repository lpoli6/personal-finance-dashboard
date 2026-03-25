interface PageHeaderProps {
  title: string;
  description?: string;
}

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="mb-10">
      <h1 className="text-3xl font-display tracking-tight">{title}</h1>
      {description && (
        <p className="text-sm text-muted-foreground/70 mt-1.5">{description}</p>
      )}
    </div>
  );
}
