# Golden Cafe: ready to import

`store.json` holds the shop: Golden Cafe, Wattala, Sri Lanka, with 72 items in LKR. It is a **draft**, so customers see nothing until someone presses Publish. It is not in the live database yet.

## Add it to the live site

Run these from the repo root. `.env.local` points the command at Neon, and its first line of output names the database it used.

1. Refresh the database address:

   ```bash
   vercel env pull .env.local
   ```

2. Import the shop. You should see `Database: Neon (DATABASE_URL)` and `Imported 1 new shop(s)`. `Imported 0` means the address `golden-cafe` is already taken, and nothing was changed.

   ```bash
   npm run import-json -- docs/shops/golden-cafe
   ```

3. Sign in as an administrator and open **Clients → Shop ownership**. Give Golden Cafe to your own account for now, so you can check it first. You can't open a shop once it belongs to a client. Don't use `npm run claim-shops` for this, because it takes every unassigned shop, not only this one.
4. Switch to Golden Cafe in the studio, open **Menu**, make any corrections below and press **Publish** when the prices are confirmed.
5. On the **Clients** page, under **New client account**, enter the owner's name and email and choose the **Free** plan, which includes one shop. Press **Create account**.
6. Copy the sign-in details straight away, because the temporary password is shown only once. Give them to the owner, who chooses their own password at first sign-in.
7. Under **Shop ownership**, change Golden Cafe to the new account.
8. The customer menu is at `https://starpulse-beta.vercel.app/?biz=golden-cafe&view=menu`. The QR code is set to open the menu, and moving the shop doesn't change its address.

## Please confirm against the board

The photo is low resolution with some glare, and a fan covers part of the shop name.

**Prices that look odd**

| Item | Price | Why to check |
| --- | --- | --- |
| Plain Dosa | 140 | Far cheaper than the other dosas (Paper Roast is 300, most are 350 or more) |
| Paneer Dosa | 670 | Costs more than Paneer Masala Dosa (600) |
| Idli | 280 | High next to the other snacks in that section (120-140) |

**Wording only the shop can settle**

- **Vegetable ST. Biryani:** "ST." is kept from the board. It may mean string hopper. Tell me what it stands for, or leave it.
- **Milkshake (390) and Rolls (120):** the board gives no flavour or filling.
- **Cheese Onion, Garlic Masala, Garlic Onion Masala, Garlic Cheese Masala:** the board doesn't say "Dosa" in these names, so it isn't added. They do appear under Dosa.

**Layout kept from the board**

- Chapathi, Poori and the three curries are listed under **Dosa**.
- Coffee, milk, Milo and Nestomalt are listed under **Hot Tea**.
- Board numbers aren't shown to customers. Numbers 16-21 and 60-64 aren't on the board, so check that no items are missing.

**Details not given, left blank**

- Street address (only "Wattala" is known), phone number, opening hours, logo and cover photo.
- No descriptions or dietary labels. The menu looks vegetarian, but nothing says so until the shop confirms it.

## Spelling corrected (24 names)

| On the board | On the menu |
| --- | --- |
| Orang | Orange |
| Avacado | Avocado |
| Faluda | Falooda |
| Mango milk shake | Mango Milkshake |
| Pine Apple | Pineapple |
| Milke Shake | Milkshake |
| Water Melon | Watermelon |
| Nestomolt | Nestomalt |
| Vegi Roti | Vegetable Roti |
| Idly | Idli |
| Parata with Sambar (1pic) | Paratha with Sambar (1 pc) |
| Ala Parata | Ala Paratha |
| Vegitable ST. Biriyani | Vegetable ST. Biryani |
| Vegitable Kottu | Vegetable Kottu |
| Vegitable Noodles | Vegetable Noodles |
| Vegitable Macroni | Vegetable Macaroni |
| Chili Paratha | Chilli Paratha |
| Mushromm Masala with Cheese | Mushroom Masala with Cheese |
| Panneer Dosa | Paneer Dosa |
| Panneer Masala Dosa | Paneer Masala Dosa |
| Gee Rava Dosa | Ghee Rava Dosa |
| Paper Rost | Paper Roast |
| Ghee Rost | Ghee Roast |
| Rava Gee Masala Dosa | Rava Ghee Masala Dosa |

## Photos (13 of 72 items)

**None of these photos show Golden Cafe's food.** They come from Wikimedia Commons and show the same kind of dish at other places, so the cafe's own may look different. The menu says so under its heading: "Photos show examples of each dish and were not taken at Golden Cafe."

The licences below are what Commons lists for each file, as stated by the person who uploaded it. Neither CC0 nor public domain requires a credit. The photos load from Wikimedia, so one would stop showing if Commons removed it.

| Menu item | Licence | Author on Commons | Source |
| --- | --- | --- | --- |
| Orange | Public domain | Agricultural Research Service | [Orange juice 1](https://commons.wikimedia.org/wiki/File:Orange_juice_1.jpg) |
| Falooda | CC0 | Miansari66 | [Karachi Falooda](https://commons.wikimedia.org/wiki/File:Karachi_Falooda.jpg) |
| Apple Juice | CC0 | Bruno Glätsch | [Apple juice 3](https://commons.wikimedia.org/wiki/File:Apple_juice_3.jpg) |
| Watermelon | CC0 | Divya Chinnasamy | [Water melon juice](https://commons.wikimedia.org/wiki/File:Water_melon_juice.jpg) |
| Milk Masala Tea | Public domain | Miansari66 | [Masala Chai](https://commons.wikimedia.org/wiki/File:Masala_Chai.JPG) |
| Milk Coffee | CC0 | shixugang | [Coffee with milk](https://commons.wikimedia.org/wiki/File:Coffee_with_milk_(563800)_(cropped).jpg) |
| Samosa | CC0 | Swathi sri srinivasa raghavan | [Samosa with sweet chutney](https://commons.wikimedia.org/wiki/File:Samosa_with_sweet_chutney.jpg) |
| Idli | CC0 | Mowglee | [Sambar idli](https://commons.wikimedia.org/wiki/File:Sambar-idli.jpg) |
| Tomato Uthappam | Public domain | Uploader's own work | [Uttapam garnishing](https://commons.wikimedia.org/wiki/File:Uttapam-garnishing.jpg) |
| Paneer Masala Dosa | CC0 | Andy Li | [Paneer masala dosa](https://commons.wikimedia.org/wiki/File:PANEER_MASALA_DOSA_-_Mini_MADRAS_2026-05-03.jpg) |
| Rava Dosa | Public domain | Chaitanya.lala | [Rava dosa](https://commons.wikimedia.org/wiki/File:Rava_dosa.JPG) |
| Plain Dosa | CC0 | Andy Li | [Plain dosa](https://commons.wikimedia.org/wiki/File:PLAIN_DOSA_-_Mini_Madras_2026-03-13.jpg) |
| Masala Dosa | CC0 | Billjones94 | [Masala dosa](https://commons.wikimedia.org/wiki/File:Masala_Dosa_served_as_lunch_in_Howrah_Maidan,_West_Bengal.jpg) |

The other 59 items have no photo, because no suitable licensed photo turned up. Photos that didn't fit were left out: the string hoppers plate, for example, also had prawns and fish on it.

**To replace or remove them:** upload the cafe's own photos under **Menu → item → Item photo**. To hide all photos, turn off item photos in **Menu → Design**. Either way, once no example photos remain, delete that line under **Menu → Design → Menu introduction**.
