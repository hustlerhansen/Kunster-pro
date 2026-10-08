-- =====================================================================
-- Kunstner Pro – DEMODATA (generert av scripts/generate-seed.ts)
-- Fiktive produkter, priser, lagertall og innkjøpskost. Merket is_demo = true.
-- Ingen anmeldelser, kunder eller salgsdata opprettes.
-- =====================================================================

insert into public.settings (key, value) values
  ('store', '{"name":"Kunstner Pro","tagline":"Oljemaling & Kunstmateriell","main_message":"Spar penger uten å gå på kompromiss med kvaliteten.","support_email":null,"support_phone":null,"support_hours":null}'::jsonb),
  ('delivery', '{"show_delivery_time":false,"delivery_time_text":null,"dispatch_text":null,"free_shipping_threshold_ore":99900}'::jsonb),
  ('banner', '{"items":[{"icon":"truck","text":"Rask levering i hele Norge","href":"/frakt-og-levering"},{"icon":"gift","text":"Fri frakt over 999 kr","href":"/frakt-og-levering"},{"icon":"star","text":"Profesjonell kvalitet","href":null},{"icon":"card","text":"Handlekonto for bedrifter","href":"/handlekonto"},{"icon":"headset","text":"Norsk kundeservice","href":"/kontakt"}]}'::jsonb),
  ('payments', '{"card_enabled":true,"vipps_enabled":false,"invoice_enabled":false}'::jsonb),
  ('company', '{"legal_name":null,"org_number":null,"vat_registered":true,"address":null,"email":null,"phone":null}'::jsonb),
  ('hero', '{"image_url":null,"image_alt":null}'::jsonb)
on conflict (key) do nothing;

insert into public.brands (id, slug, name, description, is_house_brand) values
  ('5041fb95-4b6b-4daa-8180-e63fe4e0378c', 'kunstner-pro-studio', 'Kunstner Pro Studio', 'Demovaremerke brukt i demosortimentet. Erstattes med ekte merkevarer før lansering.', true)
on conflict (id) do nothing;

insert into public.categories (id, slug, name, tagline, description, long_description, image_url, seo_title, seo_description, sort_order, is_active) values
  ('bdbd97ab-5530-469e-8d67-e91d88bf4228', 'oljemaling', 'Oljemaling', 'Enkeltfarger, sett og store tuber', 'Oljemaling for kunstnere som stiller høye krav – enkeltfarger i flere tubestørrelser, komplette sett og store tuber for større formater.', '## Kjøpe oljemaling på nett

Hos Kunstner Pro finner du et kuratert utvalg oljemaling for både øvede og profesjonelle kunstnere. Vi fokuserer på et oversiktlig sortiment framfor hundrevis av tilfeldige produkter, slik at det er enkelt å finne riktig farge i riktig størrelse.

### Velg riktig tubestørrelse
- **12–37 ml** passer for farger du bruker lite av, og for å prøve nye kulører.
- **60 ml** er et godt valg for farger du bruker jevnlig.
- **200 ml** lønner seg for hvitt og andre farger du bruker mye av, og gir lavere pris per milliliter.

### Om fargeinformasjon
Pigmentinformasjon, dekkevne og lysekthet oppgis kun når produsenten har dokumentert det. Mangler opplysningen, kontakt oss gjerne – vi hjelper deg med å finne riktig produkt.', '/images/demo/kategori-oljemaling.svg', 'Oljemaling – kjøp profesjonell oljemaling på nett', 'Kjøp oljemaling på nett hos Kunstner Pro. Enkeltfarger, oljemalingssett og store tuber til konkurransedyktige priser. Levering i hele Norge.', 1, true),
  ('1ed76336-ce96-4329-8509-5d9059a2ad13', 'pensler', 'Pensler', 'Flate, runde og filbert – naturhår og syntetisk', 'Pensler til oljemaling i de formene og størrelsene du faktisk bruker – fra stive bustpensler til myke syntetiske pensler for detaljer.', '## Pensler til oljemaling

Oljemaling er tyktflytende og krever pensler som tåler mye. **Bustpensler (naturhår)** holder formen og flytter mye maling, mens **syntetiske pensler** gir jevnere strøk og presise kanter.

### Vanlige penselformer
- **Flat** – brede strøk, skarpe kanter og blokker av farge.
- **Rund** – linjer, detaljer og konturer.
- **Filbert (kattetunge)** – myke overganger og organiske former.

Les mer i guiden vår om hvordan du velger pensler.', '/images/demo/kategori-pensler.svg', 'Pensler til oljemaling – flate, runde og filbert', 'Pensler til oljemaling: penselsett, flate og runde pensler, naturhår og syntetisk. Kvalitetspensler til gode priser hos Kunstner Pro.', 2, true),
  ('ad88de39-c666-4708-8321-29e346012e82', 'lerret', 'Lerret', 'Oppspente lerret, lerretsplater og pakker', 'Oppspente lerret, lerretsplater og lerret i pakker i vanlige formater. Kjøp flere og spar – perfekt for kurs, skoler og atelierer.', '## Lerret til maling

Et godt lerret er grunnlaget for maleriet. Vi oppgir alltid **materiale, grunning, dybde og mål** slik at du vet nøyaktig hva du får.

### Oppspent lerret eller lerretsplate?
- **Oppspent lerret** på blindramme er standard for ferdige malerier.
- **Lerretsplater** er rimelige og plassbesparende – fine til studier og skisser.
- **Lerret i pakker** gir lavere pris per stk.', '/images/demo/kategori-lerret.svg', 'Lerret til maling – oppspente lerret og lerretsplater', 'Lerret til maling: oppspente lerret, lerretsplater og lerret i pakker. Tydelige mål, materiale og grunning. Mengderabatt ved kjøp av flere.', 3, true),
  ('45e5cbef-83bc-4f1c-8d1f-0bc9004f7efe', 'malermedium', 'Malermedium & tilbehør', 'Linolje, medium og penselrens', 'Linolje, malermedium og rengjøring – det du trenger for å justere konsistens og tørketid, og ta vare på penslene dine.', '## Malermedium og tilbehør til oljemaling

Medium brukes for å endre konsistens, glans og tørketid i oljemaling. **Linolje** er det klassiske bindemiddelet i oljemaling og brukes ofte for å gjøre malingen mer flytende.

Husk prinsippet **«fett over magert»**: lagene oppå bør inneholde like mye eller mer olje enn lagene under, for å redusere risikoen for sprekkdannelser.', '/images/demo/kategori-malermedium.svg', 'Malermedium og linolje til oljemaling', 'Linolje, malermedium og penselrens til oljemaling. Alt du trenger for å justere konsistens og ta vare på penslene.', 4, true),
  ('d19aa7dc-d833-4cef-836e-bd9aff5222ad', 'malersett', 'Malersett', 'Start- og profesjonelle sett', 'Ferdig sammensatte sett med oljemaling, pensler, lerret og medium. Du ser alltid hva du sparer sammenlignet med enkeltkjøp.', '## Malersett for oljemaling

Våre sett er satt sammen av produkter fra det faste sortimentet. Derfor kan vi vise nøyaktig **hva settet ville kostet ved enkeltkjøp** – og hvor mye du sparer.', '/images/demo/kategori-malersett.svg', 'Malersett for oljemaling – startpakke og profesjonelle sett', 'Malersett for oljemaling: startpakke for nybegynnere, profesjonell malepakke og komplett kunstnersett. Se hva du sparer mot enkeltkjøp.', 5, true)
on conflict (id) do nothing;

insert into public.products (id, slug, name, subtitle, short_description, description, category_id, brand_id, product_type, specs, usage, status, is_demo, featured, sort_order, related_product_ids) values
  ('13e40a55-a816-4988-8005-396b167261fe', 'oljemalingssett-12', 'Oljemalingssett 12 farger', '12 tuber à 21 ml', 'Komplett palett med 12 farger – et godt utgangspunkt for både studier og ferdige arbeider.', 'Et sett med 12 oljefarger i tuber à 21 ml, satt sammen for å gi en allsidig palett med varme og kalde grunnfarger, jordfarger, hvitt og sort.

Settet leveres i en oppbevaringseske.', 'bdbd97ab-5530-469e-8d67-e91d88bf4228', '5041fb95-4b6b-4daa-8180-e63fe4e0378c', 'oil_paint', '{"volume":"12 × 21 ml","contents":"12 farger inkl. hvitt og sort"}'::jsonb, 'Maleri på lerret, lerretsplate og grunnet treplate.', 'active', true, true, 0, '{"53e14193-5d15-4c54-8e23-5751dcae5262","1bd5f147-da63-4a30-8446-3b8933ad9c1a","c278fc33-ddd7-4618-8672-1e55ce588702"}'),
  ('53e14193-5d15-4c54-8e23-5751dcae5262', 'titanhvit', 'Oljemaling Titanhvit', 'Studiokvalitet', 'Hvit oljemaling – fargen de fleste bruker mest av. Velg stor tube og spar per milliliter.', 'Titanhvit er den mest brukte hvitfargen i oljemaling. Fordi hvitt brukes i nesten alle blandinger, lønner det seg å kjøpe større tuber.

Tilgjengelig i fire størrelser fra 12 ml til 200 ml.', 'bdbd97ab-5530-469e-8d67-e91d88bf4228', '5041fb95-4b6b-4daa-8180-e63fe4e0378c', 'oil_paint', '{"color":"Titanhvit"}'::jsonb, 'Blanding, lysing av farger og dekkende partier.', 'active', true, true, 1, '{"e032c2ec-2409-494f-874c-01ba47aef065","28c71bd0-bf76-489d-86e9-302ae4f23637","c278fc33-ddd7-4618-8672-1e55ce588702"}'),
  ('e032c2ec-2409-494f-874c-01ba47aef065', 'ultramarinbla', 'Oljemaling Ultramarinblå', 'Studiokvalitet', 'Dyp, varm blåfarge – en klassiker på paletten.', 'Ultramarinblå er en dyp blåfarge som brukes til himmel, skygger og mørke blandinger.

Tilgjengelig i fire størrelser fra 12 ml til 200 ml.', 'bdbd97ab-5530-469e-8d67-e91d88bf4228', '5041fb95-4b6b-4daa-8180-e63fe4e0378c', 'oil_paint', '{"color":"Ultramarinblå"}'::jsonb, 'Himmel, vann, skygger og mørke blandinger.', 'active', true, true, 2, '{"53e14193-5d15-4c54-8e23-5751dcae5262","9cb0df10-21ba-4b21-8a63-5e7ab409f55b","1bd5f147-da63-4a30-8446-3b8933ad9c1a"}'),
  ('28c71bd0-bf76-489d-86e9-302ae4f23637', 'gul-oker', 'Oljemaling Gul oker', 'Studiokvalitet', 'Varm jordfarge for hudtoner, landskap og undermaling.', 'Gul oker er en varm jordfarge som er mye brukt i landskap, portretter og til undermaling.

Tilgjengelig i tre størrelser.', 'bdbd97ab-5530-469e-8d67-e91d88bf4228', '5041fb95-4b6b-4daa-8180-e63fe4e0378c', 'oil_paint', '{"color":"Gul oker"}'::jsonb, 'Landskap, hudtoner og undermaling.', 'active', true, false, 3, '{"9cb0df10-21ba-4b21-8a63-5e7ab409f55b","53e14193-5d15-4c54-8e23-5751dcae5262"}'),
  ('9cb0df10-21ba-4b21-8a63-5e7ab409f55b', 'brent-sienna', 'Oljemaling Brent sienna', 'Studiokvalitet', 'Rødbrun jordfarge – allsidig til skisser, skygger og varme toner.', 'Brent sienna er en rødbrun jordfarge som mange bruker til skisser og undermaling, og i blanding med blått for nøytrale mørke toner.

Tilgjengelig i tre størrelser.', 'bdbd97ab-5530-469e-8d67-e91d88bf4228', '5041fb95-4b6b-4daa-8180-e63fe4e0378c', 'oil_paint', '{"color":"Brent sienna"}'::jsonb, 'Undermaling, skygger og varme blandinger.', 'active', true, false, 4, '{"28c71bd0-bf76-489d-86e9-302ae4f23637","e032c2ec-2409-494f-874c-01ba47aef065"}'),
  ('789e45d3-4c4d-40a8-854d-1945d09ea7fa', 'lampesort', 'Oljemaling Lampesort', 'Studiokvalitet', 'Dyp sortfarge for kontraster og mørke partier.', 'Lampesort er en dyp sortfarge for kontraster, mørke partier og gråtoner i blanding med hvitt.', 'bdbd97ab-5530-469e-8d67-e91d88bf4228', '5041fb95-4b6b-4daa-8180-e63fe4e0378c', 'oil_paint', '{"color":"Lampesort"}'::jsonb, 'Kontraster, mørke partier og gråtoner.', 'active', true, false, 5, '{"53e14193-5d15-4c54-8e23-5751dcae5262"}'),
  ('1bd5f147-da63-4a30-8446-3b8933ad9c1a', 'penselsett-10', 'Penselsett for oljemaling', '10 pensler – flate, runde og filbert', 'Allsidig sett med de mest brukte formene og størrelsene for oljemaling.', 'Et sett med 10 pensler i flate, runde og filbert-former i ulike størrelser. Syntetiske hår og lange skaft som passer til staffelimaling.

Leveres i oppbevaringsetui.', '1ed76336-ce96-4329-8509-5d9059a2ad13', '5041fb95-4b6b-4daa-8180-e63fe4e0378c', 'brush', '{"hair_type":"Syntetisk","shape":"Flat, rund og filbert","contents":"10 pensler","handle":"Langt skaft"}'::jsonb, 'Oljemaling – fra brede strøk til detaljer.', 'active', true, true, 6, '{"3badc96f-c863-49d0-88fb-4089b3202b22","59a12c14-e60e-4c6d-89bd-d69e233f1f2f","401a67ec-5069-4759-811e-9bc28680c4ff"}'),
  ('3badc96f-c863-49d0-88fb-4089b3202b22', 'flat-bustpensel', 'Flat bustpensel', 'Naturhår (svinebust)', 'Stiv naturhårpensel som flytter mye maling og holder formen.', 'Flat pensel med stive naturhår (svinebust). Godt egnet til å legge store fargeflater og arbeide med tykk maling.', '1ed76336-ce96-4329-8509-5d9059a2ad13', '5041fb95-4b6b-4daa-8180-e63fe4e0378c', 'brush', '{"hair_type":"Naturhår (svinebust)","shape":"Flat","handle":"Langt skaft"}'::jsonb, 'Store flater, impasto og blokker av farge.', 'active', true, false, 7, '{"59a12c14-e60e-4c6d-89bd-d69e233f1f2f","6c541a4f-35a4-4888-82f4-94112bb1dcfa","401a67ec-5069-4759-811e-9bc28680c4ff"}'),
  ('59a12c14-e60e-4c6d-89bd-d69e233f1f2f', 'rund-syntetisk', 'Rund pensel, syntetisk', 'Spiss for linjer og detaljer', 'Rund syntetisk pensel med god spiss – for linjer, konturer og detaljer.', 'Rund pensel med syntetiske hår som holder spissen godt. Egnet for detaljer og linjer i oljemaling.', '1ed76336-ce96-4329-8509-5d9059a2ad13', '5041fb95-4b6b-4daa-8180-e63fe4e0378c', 'brush', '{"hair_type":"Syntetisk","shape":"Rund","handle":"Langt skaft"}'::jsonb, 'Linjer, konturer og detaljer.', 'active', true, false, 8, '{"3badc96f-c863-49d0-88fb-4089b3202b22","6c541a4f-35a4-4888-82f4-94112bb1dcfa"}'),
  ('6c541a4f-35a4-4888-82f4-94112bb1dcfa', 'filbert-syntetisk', 'Filbert pensel, syntetisk', 'Kattetunge', 'Avrundet flat pensel for myke overganger og organiske former.', 'Filbert (kattetunge) kombinerer egenskapene til flat og rund pensel. Fin til blanding av overganger og myke kanter.', '1ed76336-ce96-4329-8509-5d9059a2ad13', '5041fb95-4b6b-4daa-8180-e63fe4e0378c', 'brush', '{"hair_type":"Syntetisk","shape":"Filbert","handle":"Langt skaft"}'::jsonb, 'Overganger, portrett og organiske former.', 'active', true, false, 9, '{"3badc96f-c863-49d0-88fb-4089b3202b22","59a12c14-e60e-4c6d-89bd-d69e233f1f2f"}'),
  ('54af1600-ab8d-47cd-895d-06066b770fcb', 'oppspent-lerret-bomull', 'Oppspent lerret, bomull', '380 g/m² · 1,8 cm dybde', 'Oppspent bomullslerret på blindramme – klart til bruk.', 'Bomullslerret spent på blindramme av tre. Grunnet fra fabrikk og klart til bruk med oljemaling.

Kjøp 5 eller flere oppspente lerret og få mengderabatt.', 'ad88de39-c666-4708-8321-29e346012e82', '5041fb95-4b6b-4daa-8180-e63fe4e0378c', 'canvas', '{"material":"Bomull, 380 g/m²","primer":"Grunnet (universalgrunning)","depth_cm":1.8,"pack_count":1}'::jsonb, 'Oljemaling og akryl.', 'active', true, true, 10, '{"74d53ac3-0875-4c02-83a2-aead196b8f8c","2f61cde3-6fcf-4158-81f6-aec1af5ea1d6","53e14193-5d15-4c54-8e23-5751dcae5262"}'),
  ('74d53ac3-0875-4c02-83a2-aead196b8f8c', 'lerret-pakke-5', 'Lerret i pakke – 5 stk', 'Oppspent bomull 30 × 40 cm', 'Fem oppspente lerret i samme format – lavere pris per lerret.', 'Pakke med fem oppspente bomullslerret i formatet 30 × 40 cm. Perfekt for kurs, serier og studier.', 'ad88de39-c666-4708-8321-29e346012e82', '5041fb95-4b6b-4daa-8180-e63fe4e0378c', 'canvas', '{"material":"Bomull, 380 g/m²","primer":"Grunnet (universalgrunning)","width_cm":30,"height_cm":40,"depth_cm":1.8,"pack_count":5}'::jsonb, 'Oljemaling og akryl, kurs og serier.', 'active', true, true, 11, '{"54af1600-ab8d-47cd-895d-06066b770fcb","2f61cde3-6fcf-4158-81f6-aec1af5ea1d6"}'),
  ('2f61cde3-6fcf-4158-81f6-aec1af5ea1d6', 'lerretsplater', 'Lerretsplater', 'Pakke med 3 stk', 'Lerret på stiv plate – rimelig og plassbesparende for studier og skisser.', 'Lerretsplater med bomullslerret limt på stiv plate. Leveres i pakker med tre plater.', 'ad88de39-c666-4708-8321-29e346012e82', '5041fb95-4b6b-4daa-8180-e63fe4e0378c', 'canvas', '{"material":"Bomullslerret på plate","primer":"Grunnet (universalgrunning)","pack_count":3}'::jsonb, 'Studier, skisser og friluftsmaling.', 'active', true, false, 12, '{"54af1600-ab8d-47cd-895d-06066b770fcb","74d53ac3-0875-4c02-83a2-aead196b8f8c"}'),
  ('8d726418-1122-4217-85b7-ddfa07257df1', 'dypt-lerret-lin', 'Dypt lerret, lin', '4 cm dyp ramme', 'Linlerret på dyp blindramme – kan henges uten innramming.', 'Linlerret spent på dyp blindramme (4 cm). Den dype rammen gir et eksklusivt uttrykk og kan henges uten ramme.', 'ad88de39-c666-4708-8321-29e346012e82', '5041fb95-4b6b-4daa-8180-e63fe4e0378c', 'canvas', '{"material":"Lin","primer":"Grunnet (universalgrunning)","depth_cm":4,"pack_count":1}'::jsonb, 'Ferdige arbeider og utstillinger.', 'active', true, false, 13, '{"54af1600-ab8d-47cd-895d-06066b770fcb"}'),
  ('c278fc33-ddd7-4618-8672-1e55ce588702', 'linolje', 'Raffinert linolje', 'Medium for oljemaling', 'Klassisk medium for å gjøre oljemaling mer flytende.', 'Raffinert linolje brukes til å gjøre oljemaling mer flytende og gi økt glans. Bruk med måte – for mye olje kan gi rynker og gulning.

Husk prinsippet «fett over magert».', '45e5cbef-83bc-4f1c-8d1f-0bc9004f7efe', '5041fb95-4b6b-4daa-8180-e63fe4e0378c', 'medium', '{"contents":"Raffinert linolje"}'::jsonb, 'Fortynning av oljemaling og glasering.', 'active', true, true, 14, '{"8ab07bb0-54ef-4e73-8ad8-0bbaf63ccd5d","401a67ec-5069-4759-811e-9bc28680c4ff"}'),
  ('8ab07bb0-54ef-4e73-8ad8-0bbaf63ccd5d', 'malermedium', 'Malermedium for oljemaling', 'Linoljebasert', 'Allsidig medium for glasering og jevnere strøk.', 'Linoljebasert malermedium som gjør malingen lettere å arbeide med og egner seg for glasering.', '45e5cbef-83bc-4f1c-8d1f-0bc9004f7efe', '5041fb95-4b6b-4daa-8180-e63fe4e0378c', 'medium', '{"contents":"Linoljebasert medium"}'::jsonb, 'Glasering og jevnere strøk.', 'active', true, false, 15, '{"c278fc33-ddd7-4618-8672-1e55ce588702"}'),
  ('401a67ec-5069-4759-811e-9bc28680c4ff', 'penselsape', 'Penselsåpe', 'For rengjøring av pensler', 'Fast såpe for rengjøring og pleie av pensler etter oljemaling.', 'Fast penselsåpe for rengjøring av pensler. Tørk av overflødig maling først, vask med såpe og lunkent vann, og la penselen tørke liggende eller med hårene ned.', '45e5cbef-83bc-4f1c-8d1f-0bc9004f7efe', '5041fb95-4b6b-4daa-8180-e63fe4e0378c', 'accessory', '{"contents":"Fast såpe"}'::jsonb, 'Rengjøring av pensler etter maling.', 'active', true, false, 16, '{"1bd5f147-da63-4a30-8446-3b8933ad9c1a","3badc96f-c863-49d0-88fb-4089b3202b22"}'),
  ('4aa22201-bc87-4eda-8b58-fadfda2ce350', 'startpakke-oljemaling', 'Startpakke oljemaling', 'Alt du trenger for å komme i gang', 'Fem grunnfarger, penselsett, to lerret og linolje – samlet til en lavere pris.', 'En startpakke for deg som vil begynne med oljemaling. Settet er satt sammen av produkter fra vårt faste sortiment, slik at du kan se nøyaktig hva du sparer sammenlignet med enkeltkjøp.', 'd19aa7dc-d833-4cef-836e-bd9aff5222ad', '5041fb95-4b6b-4daa-8180-e63fe4e0378c', 'set', '{}'::jsonb, 'Nybegynnere og kurs.', 'active', true, true, 17, '{"6c1475ed-c9ff-4778-8957-1cebef8200a6","5d1ff8bf-8122-4238-85bf-b585c9d5dba6"}'),
  ('6c1475ed-c9ff-4778-8957-1cebef8200a6', 'profesjonell-malepakke', 'Profesjonell malepakke', 'Store tuber og bustpensler', 'For deg som maler mye: store tuber i nøkkelfarger, bustpensler og medium.', 'Malepakke med 200 ml-tuber i de mest brukte fargene, flate bustpensler i tre størrelser og malermedium. Satt sammen av produkter fra det faste sortimentet.', 'd19aa7dc-d833-4cef-836e-bd9aff5222ad', '5041fb95-4b6b-4daa-8180-e63fe4e0378c', 'set', '{}'::jsonb, 'Øvede og profesjonelle kunstnere.', 'active', true, false, 18, '{"4aa22201-bc87-4eda-8b58-fadfda2ce350","5d1ff8bf-8122-4238-85bf-b585c9d5dba6"}'),
  ('5d1ff8bf-8122-4238-85bf-b585c9d5dba6', 'komplett-kunstnersett', 'Komplett kunstnersett', 'Sett, pensler, lerret og medium', 'Oljemalingssett med 12 farger, penselsett, lerret i pakke, linolje og penselsåpe.', 'Et komplett sett for deg som vil ha alt på plass: 12 farger, 10 pensler, fem oppspente lerret, linolje og penselsåpe. Satt sammen av produkter fra vårt faste sortiment.', 'd19aa7dc-d833-4cef-836e-bd9aff5222ad', '5041fb95-4b6b-4daa-8180-e63fe4e0378c', 'set', '{}'::jsonb, 'Hobbykunstnere, kurs og gave.', 'active', true, true, 19, '{"4aa22201-bc87-4eda-8b58-fadfda2ce350","6c1475ed-c9ff-4778-8957-1cebef8200a6"}')
on conflict (id) do nothing;

insert into public.product_images (id, product_id, url, alt, sort_order, is_placeholder) values
  ('00000000-0000-4000-8000-000000000001', '13e40a55-a816-4988-8005-396b167261fe', '/images/demo/oljemalingssett-12.svg', 'Oljemalingssett 12 farger – illustrasjon', 0, true),
  ('00000000-0000-4000-8000-000000000002', '53e14193-5d15-4c54-8e23-5751dcae5262', '/images/demo/olje-titanhvit.svg', 'Oljemaling Titanhvit – illustrasjon', 0, true),
  ('00000000-0000-4000-8000-000000000003', 'e032c2ec-2409-494f-874c-01ba47aef065', '/images/demo/olje-ultramarinbla.svg', 'Oljemaling Ultramarinblå – illustrasjon', 0, true),
  ('00000000-0000-4000-8000-000000000004', '28c71bd0-bf76-489d-86e9-302ae4f23637', '/images/demo/olje-gul-oker.svg', 'Oljemaling Gul oker – illustrasjon', 0, true),
  ('00000000-0000-4000-8000-000000000005', '9cb0df10-21ba-4b21-8a63-5e7ab409f55b', '/images/demo/olje-brent-sienna.svg', 'Oljemaling Brent sienna – illustrasjon', 0, true),
  ('00000000-0000-4000-8000-000000000006', '789e45d3-4c4d-40a8-854d-1945d09ea7fa', '/images/demo/olje-lampesort.svg', 'Oljemaling Lampesort – illustrasjon', 0, true),
  ('00000000-0000-4000-8000-000000000007', '1bd5f147-da63-4a30-8446-3b8933ad9c1a', '/images/demo/penselsett-10.svg', 'Penselsett for oljemaling – illustrasjon', 0, true),
  ('00000000-0000-4000-8000-000000000008', '3badc96f-c863-49d0-88fb-4089b3202b22', '/images/demo/pensel-flat.svg', 'Flat bustpensel – illustrasjon', 0, true),
  ('00000000-0000-4000-8000-000000000009', '59a12c14-e60e-4c6d-89bd-d69e233f1f2f', '/images/demo/pensel-rund.svg', 'Rund pensel, syntetisk – illustrasjon', 0, true),
  ('00000000-0000-4000-8000-000000000010', '6c541a4f-35a4-4888-82f4-94112bb1dcfa', '/images/demo/pensel-filbert.svg', 'Filbert pensel, syntetisk – illustrasjon', 0, true),
  ('00000000-0000-4000-8000-000000000011', '54af1600-ab8d-47cd-895d-06066b770fcb', '/images/demo/lerret-oppspent.svg', 'Oppspent lerret, bomull – illustrasjon', 0, true),
  ('00000000-0000-4000-8000-000000000012', '74d53ac3-0875-4c02-83a2-aead196b8f8c', '/images/demo/lerret-pakke.svg', 'Lerret i pakke – 5 stk – illustrasjon', 0, true),
  ('00000000-0000-4000-8000-000000000013', '2f61cde3-6fcf-4158-81f6-aec1af5ea1d6', '/images/demo/lerretsplater.svg', 'Lerretsplater – illustrasjon', 0, true),
  ('00000000-0000-4000-8000-000000000014', '8d726418-1122-4217-85b7-ddfa07257df1', '/images/demo/lerret-lin.svg', 'Dypt lerret, lin – illustrasjon', 0, true),
  ('00000000-0000-4000-8000-000000000015', 'c278fc33-ddd7-4618-8672-1e55ce588702', '/images/demo/linolje.svg', 'Raffinert linolje – illustrasjon', 0, true),
  ('00000000-0000-4000-8000-000000000016', '8ab07bb0-54ef-4e73-8ad8-0bbaf63ccd5d', '/images/demo/malermedium.svg', 'Malermedium for oljemaling – illustrasjon', 0, true),
  ('00000000-0000-4000-8000-000000000017', '401a67ec-5069-4759-811e-9bc28680c4ff', '/images/demo/penselsape.svg', 'Penselsåpe – illustrasjon', 0, true),
  ('00000000-0000-4000-8000-000000000018', '4aa22201-bc87-4eda-8b58-fadfda2ce350', '/images/demo/sett-start.svg', 'Startpakke oljemaling – illustrasjon', 0, true),
  ('00000000-0000-4000-8000-000000000019', '6c1475ed-c9ff-4778-8957-1cebef8200a6', '/images/demo/sett-profesjonell.svg', 'Profesjonell malepakke – illustrasjon', 0, true),
  ('00000000-0000-4000-8000-000000000020', '5d1ff8bf-8122-4238-85bf-b585c9d5dba6', '/images/demo/sett-komplett.svg', 'Komplett kunstnersett – illustrasjon', 0, true)
on conflict (id) do nothing;

insert into public.product_variants (id, product_id, sku, name, options, price_ore, vat_rate, weight_g, color_hex, stock_on_hand, min_stock, sort_order) values
  ('31e45968-b9d9-48f5-8962-3316928d7dcb', '13e40a55-a816-4988-8005-396b167261fe', 'KP-OLJ-OLJEMALING-STD', '12 × 21 ml', '{}'::jsonb, 49900, 25, 420, null, 24, 6, 0),
  ('39f912c6-625a-45b3-8fef-337099a28b85', '53e14193-5d15-4c54-8e23-5751dcae5262', 'KP-OLJ-TITANHVIT-12', '12 ml', '{"volume_ml":12}'::jsonb, 4900, 25, 40, '#F4F1EA', 40, 10, 0),
  ('3efd97d3-755e-40ca-84ea-0dd1a49e1fa8', '53e14193-5d15-4c54-8e23-5751dcae5262', 'KP-OLJ-TITANHVIT-37', '37 ml', '{"volume_ml":37}'::jsonb, 8900, 25, 90, '#F4F1EA', 60, 15, 1),
  ('420a687f-e266-4826-83e3-37498d912f80', '53e14193-5d15-4c54-8e23-5751dcae5262', 'KP-OLJ-TITANHVIT-60', '60 ml', '{"volume_ml":60}'::jsonb, 12900, 25, 140, '#F4F1EA', 35, 10, 2),
  ('0a16b451-41b7-4a96-834a-bbe747287a7c', '53e14193-5d15-4c54-8e23-5751dcae5262', 'KP-OLJ-TITANHVIT-200', '200 ml', '{"volume_ml":200}'::jsonb, 27900, 25, 420, '#F4F1EA', 18, 6, 3),
  ('6010be53-e44c-476a-8373-eae53755f09c', 'e032c2ec-2409-494f-874c-01ba47aef065', 'KP-OLJ-ULTRAMARIN-12', '12 ml', '{"volume_ml":12}'::jsonb, 5500, 25, 40, '#1F3A93', 30, 8, 0),
  ('f31622ea-5151-402f-8e6e-b588b450a535', 'e032c2ec-2409-494f-874c-01ba47aef065', 'KP-OLJ-ULTRAMARIN-37', '37 ml', '{"volume_ml":37}'::jsonb, 9900, 25, 90, '#1F3A93', 42, 12, 1),
  ('601d8a46-dc4a-4c3b-8762-8ee04b5ccbdd', 'e032c2ec-2409-494f-874c-01ba47aef065', 'KP-OLJ-ULTRAMARIN-60', '60 ml', '{"volume_ml":60}'::jsonb, 13900, 25, 140, '#1F3A93', 20, 8, 2),
  ('893577b6-0f8c-455d-8bc2-035c5479d42b', 'e032c2ec-2409-494f-874c-01ba47aef065', 'KP-OLJ-ULTRAMARIN-200', '200 ml', '{"volume_ml":200}'::jsonb, 29900, 25, 420, '#1F3A93', 9, 4, 3),
  ('683127ba-5c94-49b9-83a2-8d14f750af63', '28c71bd0-bf76-489d-86e9-302ae4f23637', 'KP-OLJ-GULOKER-37', '37 ml', '{"volume_ml":37}'::jsonb, 8900, 25, 90, '#C9962E', 38, 10, 0),
  ('d5388f16-eb8c-4c11-84a9-fabc7a5cb68f', '28c71bd0-bf76-489d-86e9-302ae4f23637', 'KP-OLJ-GULOKER-60', '60 ml', '{"volume_ml":60}'::jsonb, 12500, 25, 140, '#C9962E', 16, 6, 1),
  ('92bdd8c6-2bfb-4c7f-8849-ea5823a82ea1', '28c71bd0-bf76-489d-86e9-302ae4f23637', 'KP-OLJ-GULOKER-200', '200 ml', '{"volume_ml":200}'::jsonb, 26900, 25, 420, '#C9962E', 7, 3, 2),
  ('726cb56a-a349-49fd-8186-6a4c5f80acef', '9cb0df10-21ba-4b21-8a63-5e7ab409f55b', 'KP-OLJ-BRENTSIENN-37', '37 ml', '{"volume_ml":37}'::jsonb, 8900, 25, 90, '#8A3B1E', 33, 10, 0),
  ('df741cc6-1a55-4e45-828e-0a54ea7938fb', '9cb0df10-21ba-4b21-8a63-5e7ab409f55b', 'KP-OLJ-BRENTSIENN-60', '60 ml', '{"volume_ml":60}'::jsonb, 12500, 25, 140, '#8A3B1E', 14, 6, 1),
  ('7e7e1736-aee1-4223-8dff-2980231fe79d', '9cb0df10-21ba-4b21-8a63-5e7ab409f55b', 'KP-OLJ-BRENTSIENN-200', '200 ml', '{"volume_ml":200}'::jsonb, 26900, 25, 420, '#8A3B1E', 2, 3, 2),
  ('77dae687-6a06-42b2-8f4d-d3a1d141497c', '789e45d3-4c4d-40a8-854d-1945d09ea7fa', 'KP-OLJ-LAMPESORT-37', '37 ml', '{"volume_ml":37}'::jsonb, 8500, 25, 90, '#1B1B1B', 28, 8, 0),
  ('e2d34033-f70e-4c6e-8e46-33996248e984', '789e45d3-4c4d-40a8-854d-1945d09ea7fa', 'KP-OLJ-LAMPESORT-60', '60 ml', '{"volume_ml":60}'::jsonb, 11900, 25, 140, '#1B1B1B', 0, 5, 1),
  ('0fd7d36e-52ce-46a1-8971-ba6024507e13', '1bd5f147-da63-4a30-8446-3b8933ad9c1a', 'KP-PEN-PENSELSETT-STD', '10 stk', '{}'::jsonb, 34900, 25, 180, null, 22, 6, 0),
  ('31c78117-d1bd-440c-8570-8eb550aaf5f2', '3badc96f-c863-49d0-88fb-4089b3202b22', 'KP-PEN-FLATBUSTPE-4', 'Str. 4', '{"size":"4"}'::jsonb, 5900, 25, 15, null, 25, 6, 0),
  ('25c76e33-d5bd-4a58-8970-950154aafc3e', '3badc96f-c863-49d0-88fb-4089b3202b22', 'KP-PEN-FLATBUSTPE-8', 'Str. 8', '{"size":"8"}'::jsonb, 7900, 25, 18, null, 25, 6, 1),
  ('88038abe-d4b8-45b3-8524-58ec4f197451', '3badc96f-c863-49d0-88fb-4089b3202b22', 'KP-PEN-FLATBUSTPE-12', 'Str. 12', '{"size":"12"}'::jsonb, 9900, 25, 22, null, 18, 5, 2),
  ('8c03910a-d8b8-4bff-8124-52a053197a9d', '3badc96f-c863-49d0-88fb-4089b3202b22', 'KP-PEN-FLATBUSTPE-16', 'Str. 16', '{"size":"16"}'::jsonb, 12900, 25, 26, null, 10, 4, 3),
  ('edc1568a-1723-4b4f-8c35-5f1c4080eb59', '59a12c14-e60e-4c6d-89bd-d69e233f1f2f', 'KP-PEN-RUNDSYNTET-2', 'Str. 2', '{"size":"2"}'::jsonb, 4900, 25, 10, null, 30, 8, 0),
  ('e7c14d18-1523-4829-8a35-5bf64280ee7f', '59a12c14-e60e-4c6d-89bd-d69e233f1f2f', 'KP-PEN-RUNDSYNTET-4', 'Str. 4', '{"size":"4"}'::jsonb, 5500, 25, 12, null, 30, 8, 1),
  ('e9c1503e-1323-4503-8835-58d04480f1a5', '59a12c14-e60e-4c6d-89bd-d69e233f1f2f', 'KP-PEN-RUNDSYNTET-6', 'Str. 6', '{"size":"6"}'::jsonb, 6500, 25, 14, null, 22, 6, 2),
  ('7b587545-d242-4e96-860c-417f61eaf4b0', '59a12c14-e60e-4c6d-89bd-d69e233f1f2f', 'KP-PEN-RUNDSYNTET-10', 'Str. 10', '{"size":"10"}'::jsonb, 8500, 25, 18, null, 12, 4, 3),
  ('5fa6c2f5-8bd2-434a-8358-0017f93ca9ac', '6c541a4f-35a4-4888-82f4-94112bb1dcfa', 'KP-PEN-FILBERTSYN-6', 'Str. 6', '{"size":"6"}'::jsonb, 6900, 25, 14, null, 20, 6, 0),
  ('4e734340-98a3-4041-8880-ce2af07cb88b', '6c541a4f-35a4-4888-82f4-94112bb1dcfa', 'KP-PEN-FILBERTSYN-10', 'Str. 10', '{"size":"10"}'::jsonb, 8900, 25, 18, null, 16, 5, 1),
  ('5273498c-9ca3-468d-8480-c7def47cbed7', '6c541a4f-35a4-4888-82f4-94112bb1dcfa', 'KP-PEN-FILBERTSYN-14', 'Str. 14', '{"size":"14"}'::jsonb, 10900, 25, 22, null, 9, 4, 2),
  ('1fd2c6a9-f3b8-4914-8a17-9a5f71816e72', '54af1600-ab8d-47cd-895d-06066b770fcb', 'KP-LER-OPPSPENTLE-30X40', '30 × 40 cm', '{"width_cm":30,"height_cm":40}'::jsonb, 7900, 25, 450, null, 60, 15, 0),
  ('1f3e7b55-f49c-4648-8b3d-bf4720eaef82', '54af1600-ab8d-47cd-895d-06066b770fcb', 'KP-LER-OPPSPENTLE-40X50', '40 × 50 cm', '{"width_cm":40,"height_cm":50}'::jsonb, 10900, 25, 650, null, 45, 10, 1),
  ('b9e89044-f1ac-491d-8ddd-ea92f0208893', '54af1600-ab8d-47cd-895d-06066b770fcb', 'KP-LER-OPPSPENTLE-50X70', '50 × 70 cm', '{"width_cm":50,"height_cm":70}'::jsonb, 16900, 25, 950, null, 30, 8, 2),
  ('35982766-5d04-4c37-8a8d-fb1cd49aca8d', '54af1600-ab8d-47cd-895d-06066b770fcb', 'KP-LER-OPPSPENTLE-60X80', '60 × 80 cm', '{"width_cm":60,"height_cm":80}'::jsonb, 21900, 25, 1200, null, 18, 6, 3),
  ('243c948f-072c-4b58-802f-abfd1f152126', '54af1600-ab8d-47cd-895d-06066b770fcb', 'KP-LER-OPPSPENTLE-80X100', '80 × 100 cm', '{"width_cm":80,"height_cm":100}'::jsonb, 34900, 25, 1900, null, 8, 3, 4),
  ('0d210092-a1ef-41fb-8356-2fe466601355', '74d53ac3-0875-4c02-83a2-aead196b8f8c', 'KP-LER-LERRETPAKK-STD', '5 × 30 × 40 cm', '{}'::jsonb, 32900, 25, 2300, null, 20, 5, 0),
  ('241224ce-2732-401d-8197-14f868178d67', '2f61cde3-6fcf-4158-81f6-aec1af5ea1d6', 'KP-LER-LERRETSPLA-24X30', '24 × 30 cm', '{"width_cm":24,"height_cm":30,"depth_cm":0.3}'::jsonb, 11900, 25, 600, null, 26, 6, 0),
  ('8ea00a1a-f0f9-4691-8e80-09104192c98f', '2f61cde3-6fcf-4158-81f6-aec1af5ea1d6', 'KP-LER-LERRETSPLA-30X40', '30 × 40 cm', '{"width_cm":30,"height_cm":40,"depth_cm":0.3}'::jsonb, 15900, 25, 900, null, 19, 6, 1),
  ('9b560aa0-be00-426b-8b1c-c716a78fb451', '8d726418-1122-4217-85b7-ddfa07257df1', 'KP-LER-DYPTLERRET-40X40', '40 × 40 cm', '{"width_cm":40,"height_cm":40}'::jsonb, 24900, 25, 900, null, 12, 4, 0),
  ('41172d01-b750-464a-8a11-3453989b4714', '8d726418-1122-4217-85b7-ddfa07257df1', 'KP-LER-DYPTLERRET-50X60', '50 × 60 cm', '{"width_cm":50,"height_cm":60}'::jsonb, 33900, 25, 1300, null, 8, 3, 1),
  ('65e697ec-d479-4441-8522-f1d224e3668f', '8d726418-1122-4217-85b7-ddfa07257df1', 'KP-LER-DYPTLERRET-70X100', '70 × 100 cm', '{"width_cm":70,"height_cm":100}'::jsonb, 59900, 25, 2600, null, 4, 2, 2),
  ('4dc1b4e1-20fe-4ab0-82df-2aff5296bc0e', 'c278fc33-ddd7-4618-8672-1e55ce588702', 'KP-MED-LINOLJE-75', '75 ml', '{"volume_ml":75}'::jsonb, 6900, 25, 110, null, 30, 8, 0),
  ('e6cdfb28-6271-4d3b-826a-017a21f3837d', 'c278fc33-ddd7-4618-8672-1e55ce588702', 'KP-MED-LINOLJE-250', '250 ml', '{"volume_ml":250}'::jsonb, 12900, 25, 320, null, 24, 6, 1),
  ('ec8b7828-303f-4c97-8372-cc261c36067d', 'c278fc33-ddd7-4618-8672-1e55ce588702', 'KP-MED-LINOLJE-500', '500 ml', '{"volume_ml":500}'::jsonb, 21900, 25, 600, null, 10, 4, 2),
  ('ac0f22b0-ddcc-4291-8659-db0ee34632e7', '8ab07bb0-54ef-4e73-8ad8-0bbaf63ccd5d', 'KP-MED-MALERMEDIU-75', '75 ml', '{"volume_ml":75}'::jsonb, 9900, 25, 110, null, 22, 6, 0),
  ('4df5f53b-f88e-4498-8e1d-507dbd8928b2', '8ab07bb0-54ef-4e73-8ad8-0bbaf63ccd5d', 'KP-MED-MALERMEDIU-250', '250 ml', '{"volume_ml":250}'::jsonb, 19900, 25, 320, null, 12, 4, 1),
  ('f7bedb03-e739-4762-8512-b36ddd6a8284', '401a67ec-5069-4759-811e-9bc28680c4ff', 'KP-TIL-PENSELSAPE-100', '100 g', '{"weight_g":100}'::jsonb, 8900, 25, 130, null, 35, 8, 0),
  ('f948b28c-0b01-497f-8a3d-075a2cbc852d', '4aa22201-bc87-4eda-8b58-fadfda2ce350', 'KP-SET-STARTPAKKE-STD', 'Startpakke', '{}'::jsonb, 79900, 25, 2100, null, 10, 3, 0),
  ('1a1ad3e8-548c-495d-8ccb-6fee1a46184b', '6c1475ed-c9ff-4778-8957-1cebef8200a6', 'KP-SET-PROFESJONE-STD', 'Profesjonell pakke', '{}'::jsonb, 139000, 25, 2400, null, 6, 2, 0),
  ('88b087da-405f-415d-83e6-c3f09c1cbed3', '5d1ff8bf-8122-4238-85bf-b585c9d5dba6', 'KP-SET-KOMPLETTKU-STD', 'Komplett sett', '{}'::jsonb, 119000, 25, 3200, null, 8, 2, 0)
on conflict (id) do nothing;

insert into public.bundle_items (bundle_product_id, variant_id, quantity) values
  ('4aa22201-bc87-4eda-8b58-fadfda2ce350', '3efd97d3-755e-40ca-84ea-0dd1a49e1fa8', 1),
  ('4aa22201-bc87-4eda-8b58-fadfda2ce350', 'f31622ea-5151-402f-8e6e-b588b450a535', 1),
  ('4aa22201-bc87-4eda-8b58-fadfda2ce350', '683127ba-5c94-49b9-83a2-8d14f750af63', 1),
  ('4aa22201-bc87-4eda-8b58-fadfda2ce350', '726cb56a-a349-49fd-8186-6a4c5f80acef', 1),
  ('4aa22201-bc87-4eda-8b58-fadfda2ce350', '77dae687-6a06-42b2-8f4d-d3a1d141497c', 1),
  ('4aa22201-bc87-4eda-8b58-fadfda2ce350', '0fd7d36e-52ce-46a1-8971-ba6024507e13', 1),
  ('4aa22201-bc87-4eda-8b58-fadfda2ce350', '1fd2c6a9-f3b8-4914-8a17-9a5f71816e72', 2),
  ('4aa22201-bc87-4eda-8b58-fadfda2ce350', '4dc1b4e1-20fe-4ab0-82df-2aff5296bc0e', 1),
  ('6c1475ed-c9ff-4778-8957-1cebef8200a6', '0a16b451-41b7-4a96-834a-bbe747287a7c', 1),
  ('6c1475ed-c9ff-4778-8957-1cebef8200a6', '893577b6-0f8c-455d-8bc2-035c5479d42b', 1),
  ('6c1475ed-c9ff-4778-8957-1cebef8200a6', '92bdd8c6-2bfb-4c7f-8849-ea5823a82ea1', 1),
  ('6c1475ed-c9ff-4778-8957-1cebef8200a6', '7e7e1736-aee1-4223-8dff-2980231fe79d', 1),
  ('6c1475ed-c9ff-4778-8957-1cebef8200a6', '25c76e33-d5bd-4a58-8970-950154aafc3e', 1),
  ('6c1475ed-c9ff-4778-8957-1cebef8200a6', '88038abe-d4b8-45b3-8524-58ec4f197451', 1),
  ('6c1475ed-c9ff-4778-8957-1cebef8200a6', '8c03910a-d8b8-4bff-8124-52a053197a9d', 1),
  ('6c1475ed-c9ff-4778-8957-1cebef8200a6', '4df5f53b-f88e-4498-8e1d-507dbd8928b2', 1),
  ('5d1ff8bf-8122-4238-85bf-b585c9d5dba6', '31e45968-b9d9-48f5-8962-3316928d7dcb', 1),
  ('5d1ff8bf-8122-4238-85bf-b585c9d5dba6', '0fd7d36e-52ce-46a1-8971-ba6024507e13', 1),
  ('5d1ff8bf-8122-4238-85bf-b585c9d5dba6', '0d210092-a1ef-41fb-8356-2fe466601355', 1),
  ('5d1ff8bf-8122-4238-85bf-b585c9d5dba6', 'e6cdfb28-6271-4d3b-826a-017a21f3837d', 1),
  ('5d1ff8bf-8122-4238-85bf-b585c9d5dba6', 'f7bedb03-e739-4762-8512-b36ddd6a8284', 1)
on conflict (bundle_product_id, variant_id) do nothing;

insert into public.inventory_movements (variant_id, quantity_change, reason, note)
select id, stock_on_hand, 'initial', 'DEMO startbeholdning'
from public.product_variants
where stock_on_hand > 0
  and not exists (select 1 from public.inventory_movements m where m.variant_id = product_variants.id);

insert into public.shipping_methods (id, code, name, description, carrier, type, price_ore, free_threshold_ore, delivery_estimate, max_weight_g, requires_business, is_active, sort_order) values
  ('2ed52fcf-3f23-4fe0-8b56-d455cb2e4326', 'bring-pickup', 'Hentested', 'Hent pakken på et hentested i nærheten. Du får varsel når pakken er klar.', 'bring', 'pickup', 7900, 99900, null, 20000, false, true, 1),
  ('929dbbb4-238b-40bb-8549-7cfeb63a1c5d', 'bring-home', 'Hjemlevering', 'Levering på døren eller til ønsket adresse.', 'bring', 'home', 12900, 99900, null, 35000, false, true, 2),
  ('3911c609-e4de-45ae-83d1-befb64b08f78', 'bring-business', 'Bedriftslevering', 'Levering til bedriftsadresse på hverdager i arbeidstid.', 'bring', 'business', 9900, 99900, null, 35000, true, true, 3)
on conflict (id) do nothing;

insert into public.volume_discounts (id, name, description, product_id, category_id, min_quantity, percent_off, starts_at, ends_at, is_active) values
  ('caecdafb-d0a2-446c-8efe-cc017cb83f4a', 'Kjøp 5 lerret – spar 10 %', 'Gjelder oppspente lerret i alle størrelser. Rabatten beregnes automatisk i handlekurven.', '54af1600-ab8d-47cd-895d-06066b770fcb', null, 5, 10, null, null, true)
on conflict (id) do nothing;

insert into public.suppliers (id, name, country, region, currency, lead_time_days, notes, is_demo) values
  ('a872488f-8acb-4026-82cb-e6a13cf4a248', 'Demo-leverandør Europa (DEMO)', 'DE', 'EU', 'EUR', 14, 'DEMO – fiktiv leverandør for å vise innkjøps- og lønnsomhetsmodulene.', true)
on conflict (id) do nothing;

insert into public.supplier_products (id, supplier_id, variant_id, purchase_price, currency, min_order_quantity, is_preferred) values
  ('00000000-0000-4000-9000-000000000001', 'a872488f-8acb-4026-82cb-e6a13cf4a248', '31e45968-b9d9-48f5-8962-3316928d7dcb', 14.5, 'EUR', 6, true),
  ('00000000-0000-4000-9000-000000000002', 'a872488f-8acb-4026-82cb-e6a13cf4a248', '39f912c6-625a-45b3-8fef-337099a28b85', 1.2, 'EUR', 6, true),
  ('00000000-0000-4000-9000-000000000003', 'a872488f-8acb-4026-82cb-e6a13cf4a248', '3efd97d3-755e-40ca-84ea-0dd1a49e1fa8', 2.4, 'EUR', 6, true),
  ('00000000-0000-4000-9000-000000000004', 'a872488f-8acb-4026-82cb-e6a13cf4a248', '420a687f-e266-4826-83e3-37498d912f80', 3.5, 'EUR', 6, true),
  ('00000000-0000-4000-9000-000000000005', 'a872488f-8acb-4026-82cb-e6a13cf4a248', '0a16b451-41b7-4a96-834a-bbe747287a7c', 7.9, 'EUR', 6, true),
  ('00000000-0000-4000-9000-000000000006', 'a872488f-8acb-4026-82cb-e6a13cf4a248', '6010be53-e44c-476a-8373-eae53755f09c', 1.5, 'EUR', 6, true),
  ('00000000-0000-4000-9000-000000000007', 'a872488f-8acb-4026-82cb-e6a13cf4a248', 'f31622ea-5151-402f-8e6e-b588b450a535', 2.8, 'EUR', 6, true),
  ('00000000-0000-4000-9000-000000000008', 'a872488f-8acb-4026-82cb-e6a13cf4a248', '601d8a46-dc4a-4c3b-8762-8ee04b5ccbdd', 3.9, 'EUR', 6, true),
  ('00000000-0000-4000-9000-000000000009', 'a872488f-8acb-4026-82cb-e6a13cf4a248', '893577b6-0f8c-455d-8bc2-035c5479d42b', 8.6, 'EUR', 6, true),
  ('00000000-0000-4000-9000-000000000010', 'a872488f-8acb-4026-82cb-e6a13cf4a248', '683127ba-5c94-49b9-83a2-8d14f750af63', 2.3, 'EUR', 6, true),
  ('00000000-0000-4000-9000-000000000011', 'a872488f-8acb-4026-82cb-e6a13cf4a248', 'd5388f16-eb8c-4c11-84a9-fabc7a5cb68f', 3.3, 'EUR', 6, true),
  ('00000000-0000-4000-9000-000000000012', 'a872488f-8acb-4026-82cb-e6a13cf4a248', '92bdd8c6-2bfb-4c7f-8849-ea5823a82ea1', 7.4, 'EUR', 6, true),
  ('00000000-0000-4000-9000-000000000013', 'a872488f-8acb-4026-82cb-e6a13cf4a248', '726cb56a-a349-49fd-8186-6a4c5f80acef', 2.3, 'EUR', 6, true),
  ('00000000-0000-4000-9000-000000000014', 'a872488f-8acb-4026-82cb-e6a13cf4a248', 'df741cc6-1a55-4e45-828e-0a54ea7938fb', 3.3, 'EUR', 6, true),
  ('00000000-0000-4000-9000-000000000015', 'a872488f-8acb-4026-82cb-e6a13cf4a248', '7e7e1736-aee1-4223-8dff-2980231fe79d', 7.4, 'EUR', 6, true),
  ('00000000-0000-4000-9000-000000000016', 'a872488f-8acb-4026-82cb-e6a13cf4a248', '77dae687-6a06-42b2-8f4d-d3a1d141497c', 2.1, 'EUR', 6, true),
  ('00000000-0000-4000-9000-000000000017', 'a872488f-8acb-4026-82cb-e6a13cf4a248', 'e2d34033-f70e-4c6e-8e46-33996248e984', 3.1, 'EUR', 6, true),
  ('00000000-0000-4000-9000-000000000018', 'a872488f-8acb-4026-82cb-e6a13cf4a248', '0fd7d36e-52ce-46a1-8971-ba6024507e13', 9.8, 'EUR', 6, true),
  ('00000000-0000-4000-9000-000000000019', 'a872488f-8acb-4026-82cb-e6a13cf4a248', '31c78117-d1bd-440c-8570-8eb550aaf5f2', 1.4, 'EUR', 6, true),
  ('00000000-0000-4000-9000-000000000020', 'a872488f-8acb-4026-82cb-e6a13cf4a248', '25c76e33-d5bd-4a58-8970-950154aafc3e', 1.9, 'EUR', 6, true),
  ('00000000-0000-4000-9000-000000000021', 'a872488f-8acb-4026-82cb-e6a13cf4a248', '88038abe-d4b8-45b3-8524-58ec4f197451', 2.5, 'EUR', 6, true),
  ('00000000-0000-4000-9000-000000000022', 'a872488f-8acb-4026-82cb-e6a13cf4a248', '8c03910a-d8b8-4bff-8124-52a053197a9d', 3.2, 'EUR', 6, true),
  ('00000000-0000-4000-9000-000000000023', 'a872488f-8acb-4026-82cb-e6a13cf4a248', 'edc1568a-1723-4b4f-8c35-5f1c4080eb59', 1.1, 'EUR', 6, true),
  ('00000000-0000-4000-9000-000000000024', 'a872488f-8acb-4026-82cb-e6a13cf4a248', 'e7c14d18-1523-4829-8a35-5bf64280ee7f', 1.3, 'EUR', 6, true),
  ('00000000-0000-4000-9000-000000000025', 'a872488f-8acb-4026-82cb-e6a13cf4a248', 'e9c1503e-1323-4503-8835-58d04480f1a5', 1.6, 'EUR', 6, true),
  ('00000000-0000-4000-9000-000000000026', 'a872488f-8acb-4026-82cb-e6a13cf4a248', '7b587545-d242-4e96-860c-417f61eaf4b0', 2.1, 'EUR', 6, true),
  ('00000000-0000-4000-9000-000000000027', 'a872488f-8acb-4026-82cb-e6a13cf4a248', '5fa6c2f5-8bd2-434a-8358-0017f93ca9ac', 1.7, 'EUR', 6, true),
  ('00000000-0000-4000-9000-000000000028', 'a872488f-8acb-4026-82cb-e6a13cf4a248', '4e734340-98a3-4041-8880-ce2af07cb88b', 2.2, 'EUR', 6, true),
  ('00000000-0000-4000-9000-000000000029', 'a872488f-8acb-4026-82cb-e6a13cf4a248', '5273498c-9ca3-468d-8480-c7def47cbed7', 2.8, 'EUR', 6, true),
  ('00000000-0000-4000-9000-000000000030', 'a872488f-8acb-4026-82cb-e6a13cf4a248', '1fd2c6a9-f3b8-4914-8a17-9a5f71816e72', 2.1, 'EUR', 6, true),
  ('00000000-0000-4000-9000-000000000031', 'a872488f-8acb-4026-82cb-e6a13cf4a248', '1f3e7b55-f49c-4648-8b3d-bf4720eaef82', 2.9, 'EUR', 6, true),
  ('00000000-0000-4000-9000-000000000032', 'a872488f-8acb-4026-82cb-e6a13cf4a248', 'b9e89044-f1ac-491d-8ddd-ea92f0208893', 4.4, 'EUR', 6, true),
  ('00000000-0000-4000-9000-000000000033', 'a872488f-8acb-4026-82cb-e6a13cf4a248', '35982766-5d04-4c37-8a8d-fb1cd49aca8d', 5.7, 'EUR', 6, true),
  ('00000000-0000-4000-9000-000000000034', 'a872488f-8acb-4026-82cb-e6a13cf4a248', '243c948f-072c-4b58-802f-abfd1f152126', 9.2, 'EUR', 6, true),
  ('00000000-0000-4000-9000-000000000035', 'a872488f-8acb-4026-82cb-e6a13cf4a248', '0d210092-a1ef-41fb-8356-2fe466601355', 9.4, 'EUR', 6, true),
  ('00000000-0000-4000-9000-000000000036', 'a872488f-8acb-4026-82cb-e6a13cf4a248', '241224ce-2732-401d-8197-14f868178d67', 3.1, 'EUR', 6, true),
  ('00000000-0000-4000-9000-000000000037', 'a872488f-8acb-4026-82cb-e6a13cf4a248', '8ea00a1a-f0f9-4691-8e80-09104192c98f', 4.2, 'EUR', 6, true),
  ('00000000-0000-4000-9000-000000000038', 'a872488f-8acb-4026-82cb-e6a13cf4a248', '9b560aa0-be00-426b-8b1c-c716a78fb451', 7.2, 'EUR', 6, true),
  ('00000000-0000-4000-9000-000000000039', 'a872488f-8acb-4026-82cb-e6a13cf4a248', '41172d01-b750-464a-8a11-3453989b4714', 9.8, 'EUR', 6, true),
  ('00000000-0000-4000-9000-000000000040', 'a872488f-8acb-4026-82cb-e6a13cf4a248', '65e697ec-d479-4441-8522-f1d224e3668f', 17.5, 'EUR', 6, true),
  ('00000000-0000-4000-9000-000000000041', 'a872488f-8acb-4026-82cb-e6a13cf4a248', '4dc1b4e1-20fe-4ab0-82df-2aff5296bc0e', 1.6, 'EUR', 6, true),
  ('00000000-0000-4000-9000-000000000042', 'a872488f-8acb-4026-82cb-e6a13cf4a248', 'e6cdfb28-6271-4d3b-826a-017a21f3837d', 3.2, 'EUR', 6, true),
  ('00000000-0000-4000-9000-000000000043', 'a872488f-8acb-4026-82cb-e6a13cf4a248', 'ec8b7828-303f-4c97-8372-cc261c36067d', 5.6, 'EUR', 6, true),
  ('00000000-0000-4000-9000-000000000044', 'a872488f-8acb-4026-82cb-e6a13cf4a248', 'ac0f22b0-ddcc-4291-8659-db0ee34632e7', 2.4, 'EUR', 6, true),
  ('00000000-0000-4000-9000-000000000045', 'a872488f-8acb-4026-82cb-e6a13cf4a248', '4df5f53b-f88e-4498-8e1d-507dbd8928b2', 5.1, 'EUR', 6, true),
  ('00000000-0000-4000-9000-000000000046', 'a872488f-8acb-4026-82cb-e6a13cf4a248', 'f7bedb03-e739-4762-8512-b36ddd6a8284', 2, 'EUR', 6, true)
on conflict (id) do nothing;

insert into public.variant_costs (variant_id, supplier_id, purchase_price, currency, exchange_rate, freight_per_unit_ore, duty_per_unit_ore, other_per_unit_ore, packaging_per_unit_ore, payment_fee_percent, is_demo, notes) values
  ('31e45968-b9d9-48f5-8962-3316928d7dcb', 'a872488f-8acb-4026-82cb-e6a13cf4a248', 14.5, 'EUR', 11.5, 300, 0, 50, 200, 1.8, true, 'DEMO-kostnader'),
  ('39f912c6-625a-45b3-8fef-337099a28b85', 'a872488f-8acb-4026-82cb-e6a13cf4a248', 1.2, 'EUR', 11.5, 300, 0, 50, 200, 1.8, true, 'DEMO-kostnader'),
  ('3efd97d3-755e-40ca-84ea-0dd1a49e1fa8', 'a872488f-8acb-4026-82cb-e6a13cf4a248', 2.4, 'EUR', 11.5, 300, 0, 50, 200, 1.8, true, 'DEMO-kostnader'),
  ('420a687f-e266-4826-83e3-37498d912f80', 'a872488f-8acb-4026-82cb-e6a13cf4a248', 3.5, 'EUR', 11.5, 300, 0, 50, 200, 1.8, true, 'DEMO-kostnader'),
  ('0a16b451-41b7-4a96-834a-bbe747287a7c', 'a872488f-8acb-4026-82cb-e6a13cf4a248', 7.9, 'EUR', 11.5, 300, 0, 50, 200, 1.8, true, 'DEMO-kostnader'),
  ('6010be53-e44c-476a-8373-eae53755f09c', 'a872488f-8acb-4026-82cb-e6a13cf4a248', 1.5, 'EUR', 11.5, 300, 0, 50, 200, 1.8, true, 'DEMO-kostnader'),
  ('f31622ea-5151-402f-8e6e-b588b450a535', 'a872488f-8acb-4026-82cb-e6a13cf4a248', 2.8, 'EUR', 11.5, 300, 0, 50, 200, 1.8, true, 'DEMO-kostnader'),
  ('601d8a46-dc4a-4c3b-8762-8ee04b5ccbdd', 'a872488f-8acb-4026-82cb-e6a13cf4a248', 3.9, 'EUR', 11.5, 300, 0, 50, 200, 1.8, true, 'DEMO-kostnader'),
  ('893577b6-0f8c-455d-8bc2-035c5479d42b', 'a872488f-8acb-4026-82cb-e6a13cf4a248', 8.6, 'EUR', 11.5, 300, 0, 50, 200, 1.8, true, 'DEMO-kostnader'),
  ('683127ba-5c94-49b9-83a2-8d14f750af63', 'a872488f-8acb-4026-82cb-e6a13cf4a248', 2.3, 'EUR', 11.5, 300, 0, 50, 200, 1.8, true, 'DEMO-kostnader'),
  ('d5388f16-eb8c-4c11-84a9-fabc7a5cb68f', 'a872488f-8acb-4026-82cb-e6a13cf4a248', 3.3, 'EUR', 11.5, 300, 0, 50, 200, 1.8, true, 'DEMO-kostnader'),
  ('92bdd8c6-2bfb-4c7f-8849-ea5823a82ea1', 'a872488f-8acb-4026-82cb-e6a13cf4a248', 7.4, 'EUR', 11.5, 300, 0, 50, 200, 1.8, true, 'DEMO-kostnader'),
  ('726cb56a-a349-49fd-8186-6a4c5f80acef', 'a872488f-8acb-4026-82cb-e6a13cf4a248', 2.3, 'EUR', 11.5, 300, 0, 50, 200, 1.8, true, 'DEMO-kostnader'),
  ('df741cc6-1a55-4e45-828e-0a54ea7938fb', 'a872488f-8acb-4026-82cb-e6a13cf4a248', 3.3, 'EUR', 11.5, 300, 0, 50, 200, 1.8, true, 'DEMO-kostnader'),
  ('7e7e1736-aee1-4223-8dff-2980231fe79d', 'a872488f-8acb-4026-82cb-e6a13cf4a248', 7.4, 'EUR', 11.5, 300, 0, 50, 200, 1.8, true, 'DEMO-kostnader'),
  ('77dae687-6a06-42b2-8f4d-d3a1d141497c', 'a872488f-8acb-4026-82cb-e6a13cf4a248', 2.1, 'EUR', 11.5, 300, 0, 50, 200, 1.8, true, 'DEMO-kostnader'),
  ('e2d34033-f70e-4c6e-8e46-33996248e984', 'a872488f-8acb-4026-82cb-e6a13cf4a248', 3.1, 'EUR', 11.5, 300, 0, 50, 200, 1.8, true, 'DEMO-kostnader'),
  ('0fd7d36e-52ce-46a1-8971-ba6024507e13', 'a872488f-8acb-4026-82cb-e6a13cf4a248', 9.8, 'EUR', 11.5, 300, 0, 50, 200, 1.8, true, 'DEMO-kostnader'),
  ('31c78117-d1bd-440c-8570-8eb550aaf5f2', 'a872488f-8acb-4026-82cb-e6a13cf4a248', 1.4, 'EUR', 11.5, 300, 0, 50, 200, 1.8, true, 'DEMO-kostnader'),
  ('25c76e33-d5bd-4a58-8970-950154aafc3e', 'a872488f-8acb-4026-82cb-e6a13cf4a248', 1.9, 'EUR', 11.5, 300, 0, 50, 200, 1.8, true, 'DEMO-kostnader'),
  ('88038abe-d4b8-45b3-8524-58ec4f197451', 'a872488f-8acb-4026-82cb-e6a13cf4a248', 2.5, 'EUR', 11.5, 300, 0, 50, 200, 1.8, true, 'DEMO-kostnader'),
  ('8c03910a-d8b8-4bff-8124-52a053197a9d', 'a872488f-8acb-4026-82cb-e6a13cf4a248', 3.2, 'EUR', 11.5, 300, 0, 50, 200, 1.8, true, 'DEMO-kostnader'),
  ('edc1568a-1723-4b4f-8c35-5f1c4080eb59', 'a872488f-8acb-4026-82cb-e6a13cf4a248', 1.1, 'EUR', 11.5, 300, 0, 50, 200, 1.8, true, 'DEMO-kostnader'),
  ('e7c14d18-1523-4829-8a35-5bf64280ee7f', 'a872488f-8acb-4026-82cb-e6a13cf4a248', 1.3, 'EUR', 11.5, 300, 0, 50, 200, 1.8, true, 'DEMO-kostnader'),
  ('e9c1503e-1323-4503-8835-58d04480f1a5', 'a872488f-8acb-4026-82cb-e6a13cf4a248', 1.6, 'EUR', 11.5, 300, 0, 50, 200, 1.8, true, 'DEMO-kostnader'),
  ('7b587545-d242-4e96-860c-417f61eaf4b0', 'a872488f-8acb-4026-82cb-e6a13cf4a248', 2.1, 'EUR', 11.5, 300, 0, 50, 200, 1.8, true, 'DEMO-kostnader'),
  ('5fa6c2f5-8bd2-434a-8358-0017f93ca9ac', 'a872488f-8acb-4026-82cb-e6a13cf4a248', 1.7, 'EUR', 11.5, 300, 0, 50, 200, 1.8, true, 'DEMO-kostnader'),
  ('4e734340-98a3-4041-8880-ce2af07cb88b', 'a872488f-8acb-4026-82cb-e6a13cf4a248', 2.2, 'EUR', 11.5, 300, 0, 50, 200, 1.8, true, 'DEMO-kostnader'),
  ('5273498c-9ca3-468d-8480-c7def47cbed7', 'a872488f-8acb-4026-82cb-e6a13cf4a248', 2.8, 'EUR', 11.5, 300, 0, 50, 200, 1.8, true, 'DEMO-kostnader'),
  ('1fd2c6a9-f3b8-4914-8a17-9a5f71816e72', 'a872488f-8acb-4026-82cb-e6a13cf4a248', 2.1, 'EUR', 11.5, 300, 0, 50, 200, 1.8, true, 'DEMO-kostnader'),
  ('1f3e7b55-f49c-4648-8b3d-bf4720eaef82', 'a872488f-8acb-4026-82cb-e6a13cf4a248', 2.9, 'EUR', 11.5, 300, 0, 50, 200, 1.8, true, 'DEMO-kostnader'),
  ('b9e89044-f1ac-491d-8ddd-ea92f0208893', 'a872488f-8acb-4026-82cb-e6a13cf4a248', 4.4, 'EUR', 11.5, 300, 0, 50, 200, 1.8, true, 'DEMO-kostnader'),
  ('35982766-5d04-4c37-8a8d-fb1cd49aca8d', 'a872488f-8acb-4026-82cb-e6a13cf4a248', 5.7, 'EUR', 11.5, 300, 0, 50, 200, 1.8, true, 'DEMO-kostnader'),
  ('243c948f-072c-4b58-802f-abfd1f152126', 'a872488f-8acb-4026-82cb-e6a13cf4a248', 9.2, 'EUR', 11.5, 300, 0, 50, 200, 1.8, true, 'DEMO-kostnader'),
  ('0d210092-a1ef-41fb-8356-2fe466601355', 'a872488f-8acb-4026-82cb-e6a13cf4a248', 9.4, 'EUR', 11.5, 300, 0, 50, 200, 1.8, true, 'DEMO-kostnader'),
  ('241224ce-2732-401d-8197-14f868178d67', 'a872488f-8acb-4026-82cb-e6a13cf4a248', 3.1, 'EUR', 11.5, 300, 0, 50, 200, 1.8, true, 'DEMO-kostnader'),
  ('8ea00a1a-f0f9-4691-8e80-09104192c98f', 'a872488f-8acb-4026-82cb-e6a13cf4a248', 4.2, 'EUR', 11.5, 300, 0, 50, 200, 1.8, true, 'DEMO-kostnader'),
  ('9b560aa0-be00-426b-8b1c-c716a78fb451', 'a872488f-8acb-4026-82cb-e6a13cf4a248', 7.2, 'EUR', 11.5, 300, 0, 50, 200, 1.8, true, 'DEMO-kostnader'),
  ('41172d01-b750-464a-8a11-3453989b4714', 'a872488f-8acb-4026-82cb-e6a13cf4a248', 9.8, 'EUR', 11.5, 300, 0, 50, 200, 1.8, true, 'DEMO-kostnader'),
  ('65e697ec-d479-4441-8522-f1d224e3668f', 'a872488f-8acb-4026-82cb-e6a13cf4a248', 17.5, 'EUR', 11.5, 300, 0, 50, 200, 1.8, true, 'DEMO-kostnader'),
  ('4dc1b4e1-20fe-4ab0-82df-2aff5296bc0e', 'a872488f-8acb-4026-82cb-e6a13cf4a248', 1.6, 'EUR', 11.5, 300, 0, 50, 200, 1.8, true, 'DEMO-kostnader'),
  ('e6cdfb28-6271-4d3b-826a-017a21f3837d', 'a872488f-8acb-4026-82cb-e6a13cf4a248', 3.2, 'EUR', 11.5, 300, 0, 50, 200, 1.8, true, 'DEMO-kostnader'),
  ('ec8b7828-303f-4c97-8372-cc261c36067d', 'a872488f-8acb-4026-82cb-e6a13cf4a248', 5.6, 'EUR', 11.5, 300, 0, 50, 200, 1.8, true, 'DEMO-kostnader'),
  ('ac0f22b0-ddcc-4291-8659-db0ee34632e7', 'a872488f-8acb-4026-82cb-e6a13cf4a248', 2.4, 'EUR', 11.5, 300, 0, 50, 200, 1.8, true, 'DEMO-kostnader'),
  ('4df5f53b-f88e-4498-8e1d-507dbd8928b2', 'a872488f-8acb-4026-82cb-e6a13cf4a248', 5.1, 'EUR', 11.5, 300, 0, 50, 200, 1.8, true, 'DEMO-kostnader'),
  ('f7bedb03-e739-4762-8512-b36ddd6a8284', 'a872488f-8acb-4026-82cb-e6a13cf4a248', 2, 'EUR', 11.5, 300, 0, 50, 200, 1.8, true, 'DEMO-kostnader')
on conflict (variant_id) do nothing;

insert into public.articles (id, slug, title, excerpt, body, cover_image_url, author_name, reading_minutes, related_product_ids, related_category_slugs, seo_title, seo_description, status, published_at) values
  ('d8c07fc7-f1f6-45b0-87c7-a4a558fccca6', 'hvordan-velge-riktig-oljemaling', 'Hvordan velge riktig oljemaling', 'Studiokvalitet eller kunstnerkvalitet, tubestørrelse og fargevalg – slik velger du oljemaling som passer måten du maler på.', 'Oljemaling finnes i mange kvaliteter og prisklasser. Riktig valg avhenger av hva du maler, hvor mye du maler – og hva du forventer av resultatet. Her er de viktigste punktene å se etter.

## 1. Kvalitetsnivå: studio eller kunstner?

De fleste produsenter deler sortimentet i to nivåer:

- **Studiokvalitet** (ofte kalt student- eller studiekvalitet) er rimeligere. Den kan inneholde mindre pigment eller erstatningspigmenter for de dyreste fargene. Godt egnet til øving, studier og større flater.
- **Kunstnerkvalitet** har normalt høyere pigmentinnhold og et bredere utvalg av enkeltpigmenter. Den gir ofte sterkere farger i blanding.

Mange profesjonelle kombinerer: rimelig hvitt i store tuber og kunstnerkvalitet i fargene der intensiteten betyr mest.

## 2. Les etiketten – og se etter dokumentasjon

Seriøse produsenter oppgir informasjon på tuben eller i et fargekart:

- **Pigmentkode** (Colour Index, for eksempel «PB29»). Den forteller hvilket pigment som faktisk brukes – uavhengig av fargenavnet.
- **Lysekthet** – hvor godt fargen tåler lys over tid. Oppgis ofte etter ASTM-skala eller produsentens egen skala.
- **Dekkevne** – om fargen er dekkende, halvdekkende eller transparent.

> Hos Kunstner Pro oppgir vi pigment, lysekthet og dekkevne **kun når produsenten har dokumentert det**. Mangler informasjonen, spør oss gjerne.

## 3. Velg riktig tubestørrelse

| Størrelse | Passer til |
|---|---|
| 12–37 ml | Farger du bruker lite av, eller vil prøve |
| 60 ml | Farger du bruker jevnlig |
| 200 ml | Hvitt og andre «arbeidsfarger» – lavest pris per ml |

**Tips:** Du bruker nesten alltid mest hvitt. Kjøp hvitt i en større tube enn de andre fargene.

## 4. En begrenset palett er et godt utgangspunkt

Du trenger ikke mange farger for å male godt. En klassisk begrenset palett kan være:

1. Titanhvit
2. Ultramarinblå
3. Gul oker
4. Brent sienna
5. En sort eller en mørk jordfarge

Med disse kan du blande et overraskende stort spekter av toner – og du lærer fargeblanding raskere.

## 5. Kjøp sett når du skal i gang

Et oljemalingssett gir deg mange farger til en lavere pris enn enkeltfarger. Når du finner ut hvilke farger du bruker mest, kan du supplere med større tuber.

## Oppsummering

- Velg kvalitetsnivå etter bruk – kombiner gjerne.
- Se etter dokumentert pigment, lysekthet og dekkevne.
- Kjøp hvitt i store tuber.
- Start med en begrenset palett.', '/images/demo/kategori-oljemaling.svg', 'Kunstner Pro', 6, '{"53e14193-5d15-4c54-8e23-5751dcae5262","e032c2ec-2409-494f-874c-01ba47aef065","13e40a55-a816-4988-8005-396b167261fe"}', '{"oljemaling"}', 'Hvordan velge riktig oljemaling – guide for kunstnere', 'Lær hvordan du velger oljemaling: kvalitetsnivåer, pigmentinformasjon, lysekthet, tubestørrelser og hvilke farger du bør starte med.', 'published', '2026-10-01T08:00:00.000Z'),
  ('daf703f8-feae-421d-8fde-ae32fe3f16b7', 'forskjellen-pa-oljemaling-og-akrylmaling', 'Forskjellen på oljemaling og akrylmaling', 'Tørketid, blanding, rengjøring og holdbarhet – en oversikt over de viktigste forskjellene mellom olje og akryl.', 'Oljemaling og akrylmaling kan se like ut på lerretet, men de oppfører seg svært forskjellig mens du maler. Her er de viktigste forskjellene.

## Bindemiddel

- **Oljemaling** består av pigment bundet i en tørkende olje, oftest linolje. Malingen tørker ved at oljen reagerer med oksygen i lufta (oksidasjon).
- **Akrylmaling** består av pigment i en vannbasert akrylemulsjon. Den tørker ved at vannet fordamper.

## Tørketid

Dette er den største praktiske forskjellen.

- **Akryl** tørker raskt – ofte i løpet av minutter. Bra for raske lag, men vanskeligere å blande vått-i-vått.
- **Olje** holder seg arbeidbar mye lenger, og et tynt lag trenger gjerne fra én dag til flere dager før det er berøringstørt. Tykke lag kan bruke vesentlig lenger tid.

Den lange åpentiden gjør det enklere å lage myke overganger og justere underveis.

## Fargeblanding og uttrykk

Oljemaling har en smøraktig konsistens og endrer seg lite i farge når den tørker. Akryl kan bli litt mørkere ved tørking. Mange opplever at olje gir dypere farger og mer glød – men det henger også sammen med kvalitet og teknikk.

## Lagoppbygging: «fett over magert»

I oljemaling bygger du opp lag etter prinsippet **fett over magert**: hvert nytt lag bør inneholde like mye eller mer olje enn laget under. Ellers kan det oppstå sprekker over tid. Akryl har ikke denne regelen.

> Du kan male olje oppå tørr akryl, men **ikke akryl oppå olje**.

## Rengjøring

- **Akryl**: vann og såpe – mens malingen fortsatt er våt.
- **Olje**: tørk av overflødig maling, rens eventuelt med et egnet rensemiddel, og vask deretter med penselsåpe og lunkent vann.

## Hva bør du velge?

| | Oljemaling | Akrylmaling |
|---|---|---|
| Tørketid | Lang | Kort |
| Blanding på lerret | Svært enkel | Krever tempo |
| Rengjøring | Krever litt mer | Vann og såpe |
| Lagregel | Fett over magert | Ingen |

Velger du olje, får du tid – og et klassisk uttrykk. Det er derfor oljemaling fortsatt er førstevalget for mange profesjonelle.', '/images/demo/olje-ultramarinbla.svg', 'Kunstner Pro', 5, '{"13e40a55-a816-4988-8005-396b167261fe","c278fc33-ddd7-4618-8672-1e55ce588702","401a67ec-5069-4759-811e-9bc28680c4ff"}', '{"oljemaling","malermedium"}', 'Oljemaling vs akrylmaling – hva er forskjellen?', 'Hva er forskjellen på oljemaling og akrylmaling? Vi sammenligner tørketid, blanding, rengjøring, utstyr og hvilke underlag som passer.', 'published', '2026-10-01T08:00:00.000Z'),
  ('2a41c3c1-1f21-46b2-8afa-2c1f28bc6c90', 'hvordan-velge-pensler', 'Hvordan velge pensler til oljemaling', 'Naturhår eller syntetisk, flat eller rund? Slik setter du sammen et penselutvalg som faktisk blir brukt.', 'Penslene påvirker strøket like mye som malingen. Her er det du trenger å vite for å velge riktig.

## Hårtype

### Naturhår (bust)
Bustpensler av svinebust er stive og har naturlig splittede hårtupper som holder godt på malingen. De er klassikeren for oljemaling og egner seg godt til tykk maling og synlige penselstrøk.

### Syntetisk
Syntetiske pensler finnes fra myke til ganske stive. De gir jevne strøk og presise kanter, og er ofte enklere å rengjøre. Mange syntetiske pensler er laget for å tåle løsemidler og oljemaling.

## De viktigste penselformene

- **Flat** – rett kant og lange hår. Brede strøk, skarpe kanter og blokker av farge.
- **Rund** – spiss tupp. Linjer, detaljer og konturer.
- **Filbert (kattetunge)** – flat med avrundet tupp. Myke overganger og organiske former; mange portrettmalere bruker mest filbert.
- **Bright** – flat og kort. God kontroll med tykk maling.

## Størrelser

Størrelsesnummer varierer mellom produsenter, men som tommelfingerregel:

- **Små (0–4):** detaljer
- **Mellomstore (6–10):** det meste av arbeidet
- **Store (12+):** undermaling og store flater

**Tips:** Bruk den største penselen du kan så lenge som mulig. Det gir friere strøk og et mer helhetlig maleri.

## Langt eller kort skaft?

Pensler for oljemaling har ofte **langt skaft**, slik at du kan stå et stykke unna lerretet på staffeliet. Kort skaft gir mer kontroll på nært hold.

## Et godt startutvalg

1. Flat bust str. 8 og 12
2. Filbert str. 6 og 10
3. Rund syntetisk str. 2 og 4

Eller velg et **penselsett** som dekker de vanligste formene – og supplér etter hvert.', '/images/demo/kategori-pensler.svg', 'Kunstner Pro', 5, '{"1bd5f147-da63-4a30-8446-3b8933ad9c1a","3badc96f-c863-49d0-88fb-4089b3202b22","6c541a4f-35a4-4888-82f4-94112bb1dcfa"}', '{"pensler"}', 'Pensler til oljemaling – slik velger du riktig', 'Guide til pensler for oljemaling: forskjellen på bustpensler og syntetiske pensler, penselformer og hvilke størrelser du bør starte med.', 'published', '2026-10-01T08:00:00.000Z'),
  ('30352f80-1eae-460d-811c-641624873ee3', 'hvordan-velge-lerret', 'Hvordan velge lerret', 'Bomull eller lin, oppspent eller plate, grunnet eller ugrunnet – en praktisk guide til lerret for oljemaling.', 'Lerretet er grunnlaget for maleriet. Her er de viktigste valgene.

## Materiale: bomull eller lin?

- **Bomull** er rimelig, jevnt og lett å spenne. Gramvekten (g/m²) sier noe om hvor kraftig stoffet er – høyere gramvekt gir et mer robust lerret.
- **Lin** har lengre fibre, en mer levende struktur og regnes som et mer eksklusivt underlag. Det er dyrere enn bomull.

## Grunning

Oljemaling skal ikke males direkte på rå stoff, fordi oljen kan skade fibrene over tid. De fleste lerret selges derfor **ferdig grunnet**, ofte med en universalgrunning (akrylgesso) som passer for både olje og akryl. Sjekk alltid produktbeskrivelsen.

## Oppspent lerret, lerretsplate eller rull?

| Type | Fordeler | Passer til |
|---|---|---|
| Oppspent lerret | Klart til bruk, kan henges | Ferdige malerier |
| Lerretsplate | Rimelig, tar liten plass | Studier, skisser, friluft |
| Lerret på rull | Valgfritt format | Erfarne som spenner selv |

## Dybde på rammen

Standard blindrammer er rundt 1,5–2 cm dype. **Dype rammer** (ca. 4 cm) kan henges uten innramming og gir et mer eksklusivt uttrykk.

## Format

Velg format etter motiv – men tenk også på ramme. Standardformater som 30 × 40, 40 × 50 og 50 × 70 cm er enklere å finne ferdige rammer til.

**Tips:** Kjøper du lerret til kurs eller serier, lønner det seg å kjøpe flere i samme format.', '/images/demo/kategori-lerret.svg', 'Kunstner Pro', 4, '{"54af1600-ab8d-47cd-895d-06066b770fcb","8d726418-1122-4217-85b7-ddfa07257df1","2f61cde3-6fcf-4158-81f6-aec1af5ea1d6"}', '{"lerret"}', 'Lerret til maling – slik velger du riktig lerret', 'Guide til lerret for oljemaling: bomull vs lin, oppspent lerret vs lerretsplater, grunning, dybde og vanlige formater.', 'published', '2026-10-01T08:00:00.000Z'),
  ('6b7c9305-1af2-49f0-8fff-71afa4ea54ba', 'utstyr-for-nybegynnere', 'Utstyr for nybegynnere i oljemaling', 'Hva trenger du egentlig for å begynne med oljemaling? En nøktern liste – uten unødvendige kjøp.', 'Det er lett å kjøpe for mye når man skal begynne med oljemaling. Her er det du faktisk trenger.

## Det du trenger

### 1. Maling
Start med en **begrenset palett**: hvitt, en blå, en gul jordfarge, en rødbrun jordfarge og eventuelt sort. Kjøp hvitt i en større tube.

### 2. Pensler
Tre til seks pensler i ulike former holder lenge: et par flate, et par filbert og en liten rund for detaljer. Et penselsett er en enkel start.

### 3. Underlag
Lerretsplater er rimelige og perfekte til øving. Kjøp gjerne et par oppspente lerret til arbeider du vil ta vare på.

### 4. Medium
**Linolje** gjør malingen mer flytende. Du klarer deg lenge med én flaske.

### 5. Palett og palettkniv
En glassplate, en tre-palett eller avrivningspalett fungerer fint. En palettkniv brukes til å blande farger.

### 6. Rengjøring
Tørkepapir eller filler, et glass til rensing og **penselsåpe** for å vaske penslene skikkelig etterpå.

## Det du kan vente med

- Mange spesialmedier
- Store mengder farger
- Dyre pensler i alle størrelser

## Sikkerhet og arbeidsmiljø

- Sørg for **god ventilasjon**.
- Tørkepapir og filler med olje kan i sjeldne tilfeller selvantenne når de ligger sammenkrøllet. Legg dem utbrettet til tørk eller i en lukket metallbeholder med vann før de kastes.
- Følg alltid produsentens sikkerhetsinformasjon.

## Startpakke

Vil du slippe å sette sammen alt selv? Vår **startpakke** inneholder grunnfarger, penselsett, lerret og linolje – og du ser nøyaktig hva du sparer sammenlignet med enkeltkjøp.', '/images/demo/sett-start.svg', 'Kunstner Pro', 5, '{"4aa22201-bc87-4eda-8b58-fadfda2ce350","13e40a55-a816-4988-8005-396b167261fe","1bd5f147-da63-4a30-8446-3b8933ad9c1a"}', '{"malersett","oljemaling"}', 'Oljemaling for nybegynnere – utstyrsliste', 'Kom i gang med oljemaling: hva du trenger av maling, pensler, lerret, medium og tilbehør – og hva du kan vente med.', 'published', '2026-10-01T08:00:00.000Z'),
  ('165ad184-cd88-42dd-8194-a02e691c6607', 'vedlikehold-av-pensler', 'Vedlikehold av pensler', 'Med riktig rengjøring og oppbevaring varer penslene mye lenger. Slik tar du vare på dem.', 'Gode pensler er en investering. Med riktig vedlikehold holder de formen i årevis.

## Rengjøring etter oljemaling – steg for steg

1. **Tørk av** så mye maling som mulig med tørkepapir eller en fille.
2. **Rens** penselen i et egnet rensemiddel om du bruker det, og tørk av igjen.
3. **Vask** med penselsåpe og lunkent vann. Gni penselen forsiktig i håndflaten til skummet er rent.
4. **Skyll** godt.
5. **Form** hårene tilbake til riktig fasong med fingrene.
6. **Tørk** penselen liggende eller med hårene ned – aldri stående med hårene opp, da vann kan renne ned i hylsen og løsne limet.

## Unngå disse feilene

- La aldri penslene stå med hårene ned i et glass over tid – de blir bøyd.
- Ikke la maling tørke inn i hylsen (metalldelen).
- Unngå varmt vann, som kan skade limet i hylsen.

## Oppbevaring

Oppbevar rene og tørre pensler liggende eller stående med hårene opp i et beger. Bruk gjerne et penseletui når du tar dem med på tur.

## Når penselen er slitt

Slitte bustpensler er ikke ubrukelige – de er ofte perfekte til undermaling, teksturer og tørrpensel-teknikk.', '/images/demo/penselsape.svg', 'Kunstner Pro', 4, '{"401a67ec-5069-4759-811e-9bc28680c4ff","1bd5f147-da63-4a30-8446-3b8933ad9c1a","3badc96f-c863-49d0-88fb-4089b3202b22"}', '{"pensler","malermedium"}', 'Rengjøring av pensler etter oljemaling', 'Slik rengjør og oppbevarer du pensler etter oljemaling, så de holder formen og varer lenger.', 'published', '2026-10-01T08:00:00.000Z')
on conflict (id) do nothing;

