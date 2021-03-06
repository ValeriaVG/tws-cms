import { html, attr } from "amp/lib";
import { Containers } from "dashboard/types";

const markdown = `---
url: /
title: Home Page Title - Website Name
description: This is SEO Description
---

# Tum nurus ille nepotes Iovemque primus

## Nobiscum quoque

Lorem markdownum ut inque Polydorus florebat oderat peremptis cur ante Lapithae
conamine, auraeque florem, in. Et *adsere hospitis* oculis pectore rite viri?
Puduit Iove frustra, [spatiumque sinebat
et](http://www.decoris-stupuitque.org/tibi.aspx) nihil est ferant calido,
quaecumque ab ignes. Sed modo **tenax** Nostra, capilli, colla fidem timendos.
Si in numine hospite [super](http://nec.net/incura) corpore, Neptune in furtim,
fatis.

## Sine vulgaris

Tibi mali non uni nec dicentem armenta. A est constitit quem. Calescit tandem;
estote meorum a dicit ait, aevo, non removi [blanditur
aegida](http://www.actis-templum.io/) ingredior.

1. Dos Cephalus digitis
2. Iaculo ingens Pygmalion Ixionis illa est Euagrum
3. Vepre quid agro dixit
4. Petunt amet fluitantia
5. Munus sternere instruitur

Nec iramque tenui extulit conceperat cretus tardis, ut pelago Mavors prodit
Aeacide, fortiter aliquid! In tua venit stratosque illa, umerique sedem, ne
adhuc ferebat pendent cultor fama **iussa** calido ei vulnere!
`;

export default {
  mount: ({ main, parameters }: Containers, params) => {
    main.innerHTML = html`<code-editor value=${attr`${markdown}`}>
    </code-editor>`;
    parameters.innerHTML = html`<page-preview></page-preview>`;
  },
};
