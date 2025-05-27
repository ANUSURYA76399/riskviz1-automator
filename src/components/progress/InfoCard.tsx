
interface InfoCardProps {
  title: string;
  items: string[];
  footer?: string;
}

export const InfoCard = ({ title, items, footer }: InfoCardProps) => {
  return (
    <div className="bg-teal-100 p-4 rounded-md">
      <h3 className="font-medium mb-2">{title}</h3>
      <ul className="list-disc pl-5 space-y-1 mb-2">
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
      {footer && <p className="text-sm">{footer}</p>}
    </div>
  );
};

