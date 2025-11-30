import RetroWindow from '@/app/components/RetroWindow';

type LinkItem = { href: string; label: string };

export default function ExternalLinksWindow({ links }: { links: LinkItem[] }) {
  if (!links || links.length === 0) return null;
  return (
    <div className="threetwogrid moveup _200">
      <div className="hideonm" />
      <div id="w-node-af26c18b-a7dc-71bf-c3c2-ceb263820a3d-72bd8f4b" className="retro-window-placeholder">
        <RetroWindow title="External links" className="widescreen">
          <div className="iconlogo"></div>
          {links.map((l, i) => (
            <a key={i} href={l.href} target="_blank" rel="noreferrer" className="v w-inline-block">
              <div className="paragraph headingbold link w-embed">{l.label}</div>
            </a>
          ))}
        </RetroWindow>
      </div>
    </div>
  );
}


