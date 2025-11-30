import Link from 'next/link';
import type { FolderLink } from '@/lib/domain/folder-links/types';

type FooterDesktopProps = {
  folderLinks: FolderLink[];
};

export default function FooterDesktop({ folderLinks }: FooterDesktopProps) {
  return (
    <div className="globalmargin">
      <div id="desktop" className="windowcanvas">
        <div id="w-node-d338f0d6-9d2e-be6a-b9db-22c2d03af9e7-c4a829df" className="wide">
          <div className="align-right">
            <div className="folder-grid">
              {folderLinks.map((link) => (
                <div key={link.id} className="icon-placeholder">
                  <div className="draggable-folder">
                    {link.external ? (
                      <a href={link.href} target="_blank" rel="noreferrer" className="iconlink w-inline-block">
                        <div className="folder">{link.icon}</div>
                        <div className="navlink foldericon">{link.label}</div>
                      </a>
                    ) : (
                      <Link href={link.href} className="iconlink w-inline-block">
                        <div className="folder">{link.icon}</div>
                        <div className="navlink foldericon">{link.label}</div>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
              {/* Extra "Account" link for the footer */}
              <div className="icon-placeholder">
                <div className="draggable-folder">
                  <Link href="/auth/login" className="iconlink w-inline-block">
                    <div className="folder"></div>
                    <div className="navlink foldericon">Account</div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
