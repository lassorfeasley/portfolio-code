/* eslint-disable @next/next/no-css-tags */
const guardCss = `
.globalmargin{max-width:1500px;margin:0 auto;padding:40px 40px 80px;}
.public-body{overflow-x:hidden;}
@media(max-width:768px){.globalmargin{padding:40px 20px 80px;}}
`;

export default function PublicHead() {
  return (
    <>
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
      />
      <link rel="stylesheet" href="/css/webflow-shared.css" />
      <link rel="stylesheet" href="/css/pixel-effect-styling.css" />
      <link rel="stylesheet" href="/css/retro-window-lightbox-styling.css" />
      <link rel="stylesheet" href="/css/scroll-bars.css" />
      <style dangerouslySetInnerHTML={{ __html: guardCss }} />
    </>
  );
}


