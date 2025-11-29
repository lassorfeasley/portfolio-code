import type { ReactNode } from 'react';

type AuthWindowProps = {
  title: string;
  children: ReactNode;
  description?: string;
  footer?: ReactNode;
};

export function AuthWindow({ title, description, children, footer }: AuthWindowProps) {
  return (
    <div className="windowcanvas">
      <div className="retro-window-placeholder">
        <div className="retro-window">
          <div className="window-bar">
            <div className="x-out" />
            <div className="window-title">{title}</div>
          </div>
          <div className="window-content">
            <div className="v _20">
              {description ? <p className="paragraph">{description}</p> : null}
              {children}
            </div>
          </div>
          {footer ? <div className="window-status-bar">{footer}</div> : null}
          <div className="resize-corner" />
        </div>
      </div>
    </div>
  );
}


