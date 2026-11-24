import type { ReactNode } from 'react';

/** Consistent page heading: eyebrow, title, one line of context and page actions. */
export default function PageHeader({ eyebrow, title, children, actions }: { eyebrow: string; title: ReactNode; children?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="page-head">
      <div className="ph-text">
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        {children && <p className="ph-sub">{children}</p>}
      </div>
      {actions && <div className="ph-actions">{actions}</div>}
    </div>
  );
}
